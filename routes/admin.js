// routes/admin.js
const express = require('express');
const router = express.Router();
const db =require('../db');
const { ensureAdmin } = require('../middleware/authMiddleware'); // Unsere Admin-Schutz-Middleware
const multer = require('multer'); // Für Dateiuploads
const csv = require('csv-parser'); // Für CSV-Verarbeitung
const fs = require('fs');

// Multer-Konfiguration (speichert temporär im 'uploads'-Ordner)
// Erstelle einen Ordner 'uploads' im Hauptverzeichnis deines Projekts
const upload = multer({ dest: 'uploads/' });


// Alle Admin-Routen mit ensureAdmin schützen
router.use(ensureAdmin);

// Admin Dashboard
router.get('/', (req, res) => {
    res.render('admin/admin_dashboard', {
        pageTitle: 'Admin Dashboard',
        // Optional: Lade hier Statistiken oder andere Admin-Infos
    });
});

// Seite für Einstellungen (GET)
router.get('/settings', async (req, res) => {
    try {
        const settingsResult = await db.query('SELECT setting_key, setting_value FROM settings');
        const settings = {};
        settingsResult.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.render('admin/admin_settings', {
            pageTitle: 'Admin Einstellungen',
            settings: settings
        });
    } catch (err) {
        console.error("Fehler beim Laden der Admin-Einstellungen:", err);
        // req.flash('error_msg', 'Fehler beim Laden der Einstellungen.'); // Später mit connect-flash
        res.redirect('/admin');
    }
});

// Einstellungen speichern (POST)
router.post('/settings', async (req, res) => {
    const { max_tickets, btc_ticket_price, processing_fee_btc /* weitere Einstellungen */ } = req.body;
    try {
        if (max_tickets) {
            await db.query(
                `INSERT INTO settings (setting_key, setting_value) VALUES ('max_tickets', $1)
                 ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
                [max_tickets]
            );
        }
        if (btc_ticket_price) {
            await db.query(
                `INSERT INTO settings (setting_key, setting_value) VALUES ('btc_ticket_price', $1)
                 ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
                [btc_ticket_price]
            );
        }
        if (processing_fee_btc) {
            await db.query(
                `INSERT INTO settings (setting_key, setting_value) VALUES ('processing_fee_btc', $1)
                 ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
                [processing_fee_btc]
            );
        }
        // req.flash('success_msg', 'Einstellungen erfolgreich gespeichert.');
        console.log('Admin Einstellungen gespeichert.');
    } catch (err) {
        console.error('Fehler beim Speichern der Admin-Einstellungen:', err);
        // req.flash('error_msg', 'Fehler beim Speichern der Einstellungen.');
    }
    res.redirect('/admin/settings');
});

// Seite für Wallet-Import (GET)
router.get('/import-wallets', (req, res) => {
    res.render('admin/admin_import_wallets', {
        pageTitle: 'Wallet Adressen importieren'
    });
});

// Wallet-Adressen importieren (POST) - CSV-Variante
router.post('/import-wallets-csv', upload.single('walletCsv'), async (req, res) => {
    if (!req.file) {
        // req.flash('error_msg', 'Bitte eine CSV-Datei auswählen.');
        console.log('Keine CSV-Datei ausgewählt');
        return res.redirect('/admin/import-wallets');
    }

    const filePath = req.file.path;
    let importedCount = 0;
    let skippedCount = 0;
    const addressesToImport = [];

    fs.createReadStream(filePath)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
        .on('data', (row) => {
            const btcAddress = row['public_address'] || row[Object.keys(row)[0]];
            if (btcAddress && typeof btcAddress === 'string' && btcAddress.trim() !== '') {
                addressesToImport.push(btcAddress.trim());
            }
        })
        .on('end', async () => {
            fs.unlinkSync(filePath); // Lösche die temporäre Datei

            if (addressesToImport.length === 0) {
                // req.flash('error_msg', 'Keine gültigen Adressen in der CSV-Datei gefunden.');
                console.log('Keine gültigen Adressen in CSV gefunden.');
                return res.redirect('/admin/import-wallets');
            }

            const client = await db.pool.connect();
            try {
                await client.query('BEGIN');
                // Erstelle eine neue Tabelle `imported_wallets`, falls noch nicht vorhanden
                // Diese speichert nur die Adressen, die Zuweisung erfolgt später.
                // Alternativ: in `wallets` mit user_id = NULL und ohne private_key
                await client.query(`
                    CREATE TABLE IF NOT EXISTS wallet_pool (
                        id SERIAL PRIMARY KEY,
                        btc_address VARCHAR(255) UNIQUE NOT NULL,
                        is_assigned BOOLEAN DEFAULT FALSE,
                        assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        assigned_at TIMESTAMP WITH TIME ZONE
                    );
                `);

                for (const address of addressesToImport) {
                    const existingWallet = await client.query('SELECT id FROM wallet_pool WHERE btc_address = $1', [address]);
                    if (existingWallet.rows.length === 0) {
                        await client.query('INSERT INTO wallet_pool (btc_address) VALUES ($1)', [address]);
                        importedCount++;
                    } else {
                        skippedCount++;
                    }
                }
                await client.query('COMMIT');
                // req.flash('success_msg', `${importedCount} neue Adressen importiert. ${skippedCount} Adressen wurden übersprungen.`);
                console.log(`${importedCount} neue Adressen importiert. ${skippedCount} übersprungen.`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error('Fehler beim Importieren der Wallet-Adressen:', err);
                // req.flash('error_msg', 'Fehler beim Importieren der Adressen.');
            } finally {
                client.release();
            }
            res.redirect('/admin/import-wallets');
        })
        .on('error', (error) => {
            fs.unlinkSync(filePath);
            console.error('Fehler beim Lesen der CSV-Datei:', error);
            // req.flash('error_msg', 'Fehler beim Verarbeiten der CSV-Datei.');
            res.redirect('/admin/import-wallets');
        });
});


// Wallet-Adressen als Liste importieren (POST)
router.post('/import-wallets-list', async (req, res) => {
    const { walletList } = req.body; // walletList ist der Name des Textarea-Feldes

    if (!walletList || typeof walletList !== 'string' || walletList.trim() === '') {
        // req.flash('error_msg', 'Bitte geben Sie eine Liste von Wallet-Adressen ein.');
        console.log('Keine Wallet-Liste eingegeben');
        return res.redirect('/admin/import-wallets');
    }

    // Adressen anhand von Zeilenumbrüchen, Kommas oder Leerzeichen trennen und leere Einträge filtern
    const addressesToImport = walletList
        .split(/[\s,;\t\n]+/)
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);


    if (addressesToImport.length === 0) {
        // req.flash('error_msg', 'Keine gültigen Adressen in der Liste gefunden.');
        console.log('Keine gültigen Adressen in der Liste gefunden');
        return res.redirect('/admin/import-wallets');
    }

    let importedCount = 0;
    let skippedCount = 0;
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`
            CREATE TABLE IF NOT EXISTS wallet_pool (
                id SERIAL PRIMARY KEY,
                btc_address VARCHAR(255) UNIQUE NOT NULL,
                is_assigned BOOLEAN DEFAULT FALSE,
                assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                assigned_at TIMESTAMP WITH TIME ZONE
            );
        `);

        for (const address of addressesToImport) {
            // Hier könntest du noch eine Validierung für das BTC-Adressformat einbauen
            const existingWallet = await client.query('SELECT id FROM wallet_pool WHERE btc_address = $1', [address]);
            if (existingWallet.rows.length === 0) {
                await client.query('INSERT INTO wallet_pool (btc_address) VALUES ($1)', [address]);
                importedCount++;
            } else {
                skippedCount++;
            }
        }
        await client.query('COMMIT');
        // req.flash('success_msg', `${importedCount} neue Adressen aus Liste importiert. ${skippedCount} Adressen wurden übersprungen.`);
        console.log(`${importedCount} neue Adressen aus Liste importiert. ${skippedCount} übersprungen.`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Fehler beim Importieren der Wallet-Adressen aus Liste:', err);
        // req.flash('error_msg', 'Fehler beim Importieren der Adressen aus Liste.');
    } finally {
        client.release();
    }
    res.redirect('/admin/import-wallets');
});


module.exports = router;