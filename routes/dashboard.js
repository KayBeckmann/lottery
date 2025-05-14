const express = require('express');
const router = express.Router();
const db = require('../db'); // Unser Datenbankmodul

// Dashboard-Route
router.get('/', async (req, res) => {
    // SIMULATION eines angemeldeten Benutzers
    // Später wird diese ID aus der Session des angemeldeten Benutzers kommen
    const currentUserId = 1; // Annahme: Benutzer mit ID 1 ist angemeldet (TestUser)

    try {
        // 1. Gekaufte Tickets des Benutzers (Anzahl und Nummern)
        const userTicketsResult = await db.query(
            'SELECT ticket_number FROM tickets WHERE user_id = $1 AND status = $2 ORDER BY ticket_number ASC',
            [currentUserId, 'paid']
        );
        const userTickets = userTicketsResult.rows; // Array von Objekten, z.B. [{ticket_number: 101}, {ticket_number: 102}]
        const userTicketCount = userTickets.length;
        const userTicketNumbers = userTickets.map(ticket => ticket.ticket_number);

        // 2. Gesamtzahl aller verkauften (bezahlten) Tickets
        const totalSoldTicketsResult = await db.query(
            "SELECT COUNT(*) AS total_sold FROM tickets WHERE status = 'paid'"
        );
        const totalSoldTickets = parseInt(totalSoldTicketsResult.rows[0].total_sold, 10);

        // 3. Maximale Anzahl an Tickets (aus Einstellungen)
        const maxTicketsSettingResult = await db.query(
            "SELECT setting_value FROM settings WHERE setting_key = 'max_tickets'"
        );
        let maxTickets = 100; // Standardwert, falls nicht in DB gefunden
        if (maxTicketsSettingResult.rows.length > 0) {
            maxTickets = parseInt(maxTicketsSettingResult.rows[0].setting_value, 10);
        }

        // 4. Verbleibende Tickets berechnen
        const remainingTickets = Math.max(0, maxTickets - totalSoldTickets); // Stellt sicher, dass es nicht negativ wird

        // Daten an das Pug-Template übergeben
        res.render('dashboard', {
            pageTitle: 'Mein Dashboard',
            userTicketCount: userTicketCount,
            userTicketNumbers: userTicketNumbers,
            totalSoldTickets: totalSoldTickets,
            maxTickets: maxTickets,
            remainingTickets: remainingTickets,
            // Später hier den echten Benutzernamen übergeben
            username: 'TestUser (Simuliert)' // Platzhalter
        });

    } catch (err) {
        console.error('Fehler beim Laden des Dashboards:', err);
        res.status(500).send('Fehler beim Laden der Dashboard-Daten.');
    }
});

module.exports = router;
