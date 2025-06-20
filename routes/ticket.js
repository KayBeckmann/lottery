// routes/ticket.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// Route zur Anzeige der Zahlungsdetails für ein bestimmtes Ticket
router.get('/:ticketId/payment', ensureAuthenticated, async (req, res, next) => {
    const { ticketId } = req.params;
    const userId = req.user.id;

    try {
        const ticketResult = await db.query(
            `SELECT
                t.id AS ticket_id,
                t.status AS ticket_status,
                t.assigned_wallet_address,
                d.name AS draw_name,
                d.ticket_price,
                d.processing_fee,
                (d.ticket_price + d.processing_fee) AS total_amount
             FROM tickets t
             JOIN draws d ON t.draw_id = d.id
             WHERE t.id = $1 AND t.user_id = $2`,
            [ticketId, userId]
        );

        if (ticketResult.rows.length === 0) {
            // Ticket nicht gefunden oder gehört nicht dem Benutzer
            // req.flash('error_msg', 'Ticket nicht gefunden oder Zugriff verweigert.');
            return res.status(404).redirect('/dashboard');
        }

        const details = ticketResult.rows[0];

        // Wenn das Ticket nicht mehr 'pending_payment' ist, kann man es nicht mehr bezahlen.
        if (details.ticket_status !== 'pending_payment') {
            // req.flash('error_msg', 'Für dieses Ticket steht keine Zahlung mehr aus.');
            return res.redirect('/dashboard');
        }

        res.render('payment_details', {
            pageTitle: 'Zahlungsdetails',
            details: details
        });

    } catch (err) {
        console.error('Fehler beim Abrufen der Zahlungsdetails:', err);
        next(err);
    }
});

module.exports = router;