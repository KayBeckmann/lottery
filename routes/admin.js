// routes/admin.js
const express = require('express');
const router = express.Router();
const db =require('../db');
const { ensureAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

router.use(ensureAdmin);

// Admin Dashboard
router.get('/', (req, res) => {
    res.render('admin/admin_dashboard', {
        pageTitle: 'Admin Dashboard',
    });
});

// --- Ziehungen (Draws) Management ---
// Liste aller Ziehungen
router.get('/draws', async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, ticket_price, processing_fee, total_tickets, status, created_at FROM draws ORDER BY created_at DESC');
        res.render('admin/admin_draws_list', { // Annahme: Neue Pug-Datei für die Listenansicht
            pageTitle: 'Ziehungen Verwalten',
            draws: result.rows,
            success_msg: req.flash ? req.flash('success_msg') : null, // Für Flash-Nachrichten
            error_msg: req.flash ? req.flash('error_msg') : null
        });
    } catch (err) {
        console.error("Fehler beim Laden der Ziehungen:", err);
        if (req.flash) req.flash('error_msg', 'Fehler beim Laden der Ziehungen.');
        res.redirect('/admin');
    }
});

// Formular zum Erstellen einer neuen Ziehung anzeigen
router.get('/draws/new', (req, res) => {
    res.render('admin/admin_draw_form', { // Annahme: Neue Pug-Datei für das Formular
        pageTitle: 'Neue Ziehung Erstellen',
        draw: {}, // Leeres Objekt für ein neues Formular
        formAction: '/admin/draws/new'
    });
});

// Neue Ziehung erstellen (POST)
router.post('/draws/new', async (req, res) => {
    const { name, ticket_price, processing_fee, total_tickets } = req.body;
    if (!name || !ticket_price || !processing_fee || !total_tickets) {
        // req.flash('error_msg', 'Bitte alle Felder ausfüllen.');
        console.log('Fehlende Felder beim Erstellen der Ziehung.');
        return res.redirect('/admin/draws/new');
    }
    try {
        await db.query(
            'INSERT INTO draws (name, ticket_price, processing_fee, total_tickets, status) VALUES ($1, $2, $3, $4, $5)',
            [name, parseFloat(ticket_price), parseFloat(processing_fee), parseInt(total_tickets), 'open']
        );
        // req.flash('success_msg', 'Ziehung erfolgreich erstellt.');
        console.log('Neue Ziehung erstellt:', name);
        res.redirect('/admin/draws');
    } catch (err) {
        console.error('Fehler beim Erstellen der Ziehung:', err);
        // req.flash('error_msg', 'Fehler beim Erstellen der Ziehung.');
        res.redirect('/admin/draws/new');
    }
});

// Formular zum Bearbeiten einer Ziehung anzeigen
router.get('/draws/:id/edit', async (req, res) => {
    try {
        const drawId = req.params.id;
        const result = await db.query('SELECT * FROM draws WHERE id = $1', [drawId]);
        if (result.rows.length === 0) {
            // req.flash('error_msg', 'Ziehung nicht gefunden.');
            return res.redirect('/admin/draws');
        }
        res.render('admin/admin_draw_form', { // Wiederverwendung des Formulars
            pageTitle: 'Ziehung Bearbeiten',
            draw: result.rows[0],
            formAction: `/admin/draws/${drawId}/edit`
        });
    } catch (err) {
        console.error('Fehler beim Laden der Ziehung zum Bearbeiten:', err);
        // req.flash('error_msg', 'Fehler beim Laden der Ziehung.');
        res.redirect('/admin/draws');
    }
});

// Ziehung aktualisieren (POST)
router.post('/draws/:id/edit', async (req, res) => {
    const drawId = req.params.id;
    const { name, ticket_price, processing_fee, total_tickets, status } = req.body;
    if (!name || !ticket_price || !processing_fee || !total_tickets || !status) {
        // req.flash('error_msg', 'Bitte alle Felder ausfüllen.');
        console.log('Fehlende Felder beim Bearbeiten der Ziehung.');
        return res.redirect(`/admin/draws/${drawId}/edit`);
    }
    try {
        await db.query(
            'UPDATE draws SET name = $1, ticket_price = $2, processing_fee = $3, total_tickets = $4, status = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6',
            [name, parseFloat(ticket_price), parseFloat(processing_fee), parseInt(total_tickets), status, drawId]
        );
        // req.flash('success_msg', 'Ziehung erfolgreich aktualisiert.');
        console.log('Ziehung aktualisiert:', name);
        res.redirect('/admin/draws');
    } catch (err) {
        console.error('Fehler beim Aktualisieren der Ziehung:', err);
        // req.flash('error_msg', 'Fehler beim Aktualisieren der Ziehung.');
        res.redirect(`/admin/draws/${drawId}/edit`);
    }
});


// --- Bestehende Einstellungen und Wallet-Import ---
// Seite für Einstellungen (GET)
router.get('/settings', async (req, res) => {
    try {
        const settingsResult = await db.query('SELECT setting_key, setting_value FROM settings');
        const settings = {};
        settingsResult.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.render('admin/admin_settings', {
            pageTitle: 'Globale Einstellungen',
            settings: settings
        });
    } catch (err) {
        console.error("Fehler beim Laden der Admin-Einstellungen:", err);
        res.redirect('/admin');
    }
});

// Einstellungen speichern (POST)
router.post('/settings', async (req, res) => {
    // Beispiel: default_ticket_price, default_processing_fee_btc
    const { default_ticket_price, default_processing_fee_btc /* weitere Einstellungen */ } = req.body;
    try {
        if (default_ticket_price) {
            await db.query(
                `INSERT INTO settings (setting_key, setting_value) VALUES ('default_ticket_price', $1)
                 ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
                [default_ticket_price]
            );
        }
        if (default_processing_fee_btc) {
            await db.query(
                `INSERT INTO settings (setting_key, setting_value) VALUES ('default_processing_fee_btc', $1)
                 ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
                [default_processing_fee_btc]
            );
        }
        console.log('Globale Einstellungen gespeichert.');
    } catch (err) {
        console.error('Fehler beim Speichern der globalen Einstellungen:', err);
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
            fs.unlinkSync(filePath); 

            if (addressesToImport.length === 0) {
                console.log('Keine gültigen Adressen in CSV gefunden.');
                return res.redirect('/admin/import-wallets');
            }

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
                    const existingWallet = await client.query('SELECT id FROM wallet_pool WHERE btc_address = $1', [address]);
                    if (existingWallet.rows.length === 0) {
                        await client.query('INSERT INTO wallet_pool (btc_address) VALUES ($1)', [address]);
                        importedCount++;
                    } else {
                        skippedCount++;
                    }
                }
                await client.query('COMMIT');
                console.log(`${importedCount} neue Adressen importiert. ${skippedCount} übersprungen.`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error('Fehler beim Importieren der Wallet-Adressen:', err);
            } finally {
                client.release();
            }
            res.redirect('/admin/import-wallets');
        })
        .on('error', (error) => {
            fs.unlinkSync(filePath);
            console.error('Fehler beim Lesen der CSV-Datei:', error);
            res.redirect('/admin/import-wallets');
        });
});


// Wallet-Adressen als Liste importieren (POST)
router.post('/import-wallets-list', async (req, res) => {
    const { walletList } = req.body; 

    if (!walletList || typeof walletList !== 'string' || walletList.trim() === '') {
        console.log('Keine Wallet-Liste eingegeben');
        return res.redirect('/admin/import-wallets');
    }

    const addressesToImport = walletList
        .split(/[\s,;\t\n]+/)
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);


    if (addressesToImport.length === 0) {
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
            const existingWallet = await client.query('SELECT id FROM wallet_pool WHERE btc_address = $1', [address]);
            if (existingWallet.rows.length === 0) {
                await client.query('INSERT INTO wallet_pool (btc_address) VALUES ($1)', [address]);
                importedCount++;
            } else {
                skippedCount++;
            }
        }
        await client.query('COMMIT');
        console.log(`${importedCount} neue Adressen aus Liste importiert. ${skippedCount} übersprungen.`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Fehler beim Importieren der Wallet-Adressen aus Liste:', err);
    } finally {
        client.release();
    }
    res.redirect('/admin/import-wallets');
});


module.exports = router;
