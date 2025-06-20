const express = require('express');
const router = express.Router();
const db = require('../db');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/authMiddleware');

// Admin Dashboard Hauptseite
router.get('/', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/admin_dashboard', {
        pageTitle: 'Admin Dashboard',
        user: req.user
    });
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
            user: req.user,
            totalUsers: totalUsers,
            unusedWallets: unusedWallets,
            showWalletWarning: unusedWallets < 10
        });
    } catch (err) {
        console.error('Fehler beim Abrufen der Admin-Übersichtsdaten:', err);
        next(err);
    }
});

// NEUE ROUTE: Zeigt die Seite zum Importieren von Wallets an
router.get('/import-wallets', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('admin/import_wallets', {
        pageTitle: 'Wallets importieren'
    });
});


// Route zum Erstellen einer neuen Ziehung (bestehend)
router.post('/draws', ensureAuthenticated, ensureAdmin, async (req, res) => {
    const { name, ticket_price, total_tickets, processing_fee } = req.body;
    try {
        const newDraw = await db.query(
            'INSERT INTO draws (name, ticket_price, total_tickets, processing_fee, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, ticket_price, total_tickets, processing_fee, 'open']
        );
        res.status(201).json(newDraw.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Serverfehler');
    }
});

module.exports = router;