// kaybeckmann/lottery/lottery-e124a1311c78967d6552fc2ce0d1629e2f8eb166/routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const upload = multer({ storage: multer.memoryStorage() });

// Haupt-Admin-Seite leitet zur Übersicht weiter
router.get('/', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.redirect('/admin/overview');
});

// Admin-Übersicht mit Statistiken
router.get('/overview', ensureAuthenticated, ensureAdmin, async (req, res, next) => {
    try {
        const userCountResult = await db.query('SELECT COUNT(*) AS total_users FROM users');
        const totalUsers = userCountResult.rows[0].total_users;
        const walletCountResult = await db.query("SELECT COUNT(*) AS unused_wallets FROM wallet_pool WHERE is_assigned = FALSE");
        const unusedWallets = parseInt(walletCountResult.rows[0].unused_wallets, 10);

        res.render('admin/admin_overview', {
            pageTitle: 'System-Übersicht',
            totalUsers: totalUsers,
            unusedWallets: unusedWallets,
            showWalletWarning: unusedWallets < 10
        });
    } catch (err) {
        console.error('Fehler beim Abrufen der Admin-Übersichtsdaten:', err);
        next(err);
    }
});

// --- ZIEHUNGEN ---
// NEU: Zeigt die LISTE aller Ziehungen an
router.get('/draws', ensureAuthenticated, ensureAdmin, async (req, res, next) => {
    try {
        const drawsResult = await db.query('SELECT * FROM draws ORDER BY created_at DESC');
        res.render('admin/admin_draws_list', { // Rendert die Liste
            pageTitle: 'Ziehungen verwalten',
            draws: drawsResult.rows
        });
    } catch (err) {
        console.error('Fehler beim Abrufen der Ziehungen:', err);
        next(err);
    }
});

// NEU: Zeigt das FORMULAR zum Erstellen einer neuen Ziehung an
router.get('/draws/new', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/admin_draw_form', { // Rendert das Formular
        pageTitle: 'Neue Ziehung erstellen'
    });
});

// Bestehend: Verarbeitet das Erstellen einer neuen Ziehung
router.post('/draws', ensureAuthenticated, ensureAdmin, async (req, res) => {
    const { name, ticket_price, total_tickets, processing_fee } = req.body;
    try {
        await db.query(
            'INSERT INTO draws (name, ticket_price, total_tickets, processing_fee, status) VALUES ($1, $2, $3, $4, $5)',
            [name, ticket_price, total_tickets, processing_fee, 'open']
        );
        res.redirect('/admin/draws'); // Leitet zur Liste zurück
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Serverfehler');
    }
});

// --- WALLET IMPORT ---
router.get('/import-wallets', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/admin_import_wallets', {
        pageTitle: 'Wallets importieren'
    });
});

router.post('/import-wallets', ensureAuthenticated, ensureAdmin, upload.single('wallet_csv'), async (req, res, next) => {
    // ... (Code für den CSV-Import bleibt unverändert)
    if (!req.file) { return res.status(400).redirect('/admin/import-wallets'); }
    const results = [];
    let headersValid = false;
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    bufferStream.pipe(csv({ mapHeaders: ({ header }) => header.trim() })).on('headers', (headers) => {
        if (headers.includes('btc_address')) { headersValid = true; }
    }).on('data', (data) => results.push(data)).on('end', async () => {
        if (!headersValid) { return res.redirect('/admin/import-wallets'); }
        if (results.length === 0) { return res.redirect('/admin/import-wallets'); }
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            let importedCount = 0;
            const query = 'INSERT INTO wallet_pool (btc_address) VALUES ($1) ON CONFLICT (btc_address) DO NOTHING';
            for (const row of results) {
                const btcAddress = row['btc_address'];
                if (btcAddress) {
                    const result = await client.query(query, [btcAddress]);
                    if (result.rowCount > 0) importedCount++;
                }
            }
            await client.query('COMMIT');
            res.redirect('/admin/overview');
        } catch (err) {
            await client.query('ROLLBACK');
            next(err);
        } finally {
            client.release();
        }
    });
});

// --- EINSTELLUNGEN ---
// NEU: Zeigt die Einstellungsseite an
router.get('/settings', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/admin_settings', {
        pageTitle: 'Einstellungen'
    });
});


module.exports = router;