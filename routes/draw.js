// routes/draw.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// Route, um ein Ticket für eine Ziehung zu "kaufen" (Zahlungsanweisung erstellen)
router.post('/:drawId/buy', ensureAuthenticated, async (req, res, next) => {
    const { drawId } = req.params;
    const userId = req.user.id;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Ziehungsinformationen abrufen und prüfen, ob noch Tickets verfügbar sind (unverändert)
        const drawResult = await client.query(
            `SELECT d.id, d.name, d.status, d.total_tickets,
                    (SELECT COUNT(*) FROM tickets WHERE draw_id = d.id AND status IN ('paid', 'pending_payment')) AS sold_tickets
             FROM draws d WHERE d.id = $1 FOR UPDATE`,
            [drawId]
        );

        if (drawResult.rows.length === 0) {
            throw new Error('Ziehung nicht gefunden.');
        }

        const draw = drawResult.rows[0];

        if (draw.status !== 'open') {
            throw new Error('Diese Ziehung ist nicht mehr für Käufe geöffnet.');
        }

        if (parseInt(draw.sold_tickets, 10) >= parseInt(draw.total_tickets, 10)) {
            throw new Error('Diese Ziehung ist leider ausverkauft.');
        }

        // ---------- ANFANG DER ÄNDERUNG ----------

        let userWalletAddress;

        // 2. Prüfen, ob dem Benutzer bereits eine Wallet zugewiesen ist.
        const existingWalletResult = await client.query(
            'SELECT btc_address FROM wallet_pool WHERE assigned_to_user_id = $1',
            [userId]
        );

        if (existingWalletResult.rows.length > 0) {
            // 2a. Wenn ja, wird die bestehende Adresse wiederverwendet.
            userWalletAddress = existingWalletResult.rows[0].btc_address;
            console.log(`Bestehende Wallet ${userWalletAddress} für User ${userId} wird wiederverwendet.`);
        } else {
            // 2b. Wenn nein, wird eine neue, freie Wallet gesucht und zugewiesen.
            console.log(`Keine Wallet für User ${userId} gefunden. Suche eine neue...`);
            
            const newWalletResult = await client.query(
                `SELECT id, btc_address FROM wallet_pool
                 WHERE is_assigned = FALSE
                 LIMIT 1 FOR UPDATE`
            );

            if (newWalletResult.rows.length === 0) {
                throw new Error('Derzeit sind keine neuen Wallet-Adressen für die Zahlung verfügbar. Bitte versuchen Sie es später erneut.');
            }

            const newWallet = newWalletResult.rows[0];
            userWalletAddress = newWallet.btc_address;

            // Die neue Wallet wird jetzt fest dem Benutzer zugewiesen.
            await client.query(
                'UPDATE wallet_pool SET is_assigned = TRUE, assigned_to_user_id = $1, assigned_at = CURRENT_TIMESTAMP WHERE id = $2',
                [userId, newWallet.id]
            );
            console.log(`Neue Wallet ${userWalletAddress} wurde User ${userId} zugewiesen.`);
        }

        // ---------- ENDE DER ÄNDERUNG ----------


        // 3. Ticket in der Datenbank erstellen (jetzt mit der korrekten Wallet-Adresse)
        const newTicketResult = await client.query(
            `INSERT INTO tickets (user_id, draw_id, status, assigned_wallet_address, payment_instruction_details)
             VALUES ($1, $2, 'pending_payment', $3, $4) RETURNING id`,
            [userId, drawId, userWalletAddress, JSON.stringify({ info: 'Use Ticket-UUID for payment reference' })]
        );

        const newTicketId = newTicketResult.rows[0].id;

        // 4. Transaktion abschließen
        await client.query('COMMIT');

        // Das Log wurde angepasst, um die korrekte zugewiesene Adresse anzuzeigen.
        console.log(`Ticket ${newTicketId} für User ${userId} und Draw ${drawId} erstellt. Wallet ${userWalletAddress} zugewiesen.`);

        // 5. Zur Zahlungsdetailseite weiterleiten
        res.redirect(`/ticket/${newTicketId}/payment`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Fehler beim Kaufvorgang:', err.message);
        res.status(500).redirect('/dashboard');
    } finally {
        client.release();
    }
});

module.exports = router;