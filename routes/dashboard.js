const express = require('express');
const router = express.Router();
const db = require('../db'); // Unser Datenbankmodul

// Dashboard-Route
router.get('/', async (req, res, next) => { // next für Fehlerbehandlung hinzugefügt
    // Der angemeldete Benutzer wird jetzt durch die Middleware in app.js in req.user bereitgestellt
    if (!req.user || !req.user.id) {
        // Sollte nicht passieren, wenn die Simulations-Middleware aktiv ist und korrekt funktioniert
        console.error("Dashboard: req.user oder req.user.id nicht verfügbar.");
        // In einer echten App würde hier vielleicht ein Redirect zum Login erfolgen
        return res.status(401).send('Nicht authentifiziert. Bitte zuerst anmelden.');
    }

    const currentUserId = req.user.id; // UUID vom simulierten/angemeldeten Benutzer
    const currentUsername = req.user.username;

    try {
        // 1. Gekaufte Tickets des Benutzers (Anzahl und Nummern)
        const userTicketsResult = await db.query(
            'SELECT ticket_number FROM tickets WHERE user_id = $1 AND status = $2 ORDER BY ticket_number ASC',
            [currentUserId, 'paid']
        );
        const userTickets = userTicketsResult.rows;
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
        if (maxTicketsSettingResult.rows.length > 0 && maxTicketsSettingResult.rows[0].setting_value) {
            maxTickets = parseInt(maxTicketsSettingResult.rows[0].setting_value, 10);
        } else {
            console.warn("Einstellung 'max_tickets' nicht in der Datenbank gefunden oder Wert ist null. Standardwert 100 wird verwendet.");
        }

        // 4. Verbleibende Tickets berechnen
        const remainingTickets = Math.max(0, maxTickets - totalSoldTickets);

        // Daten an das Pug-Template übergeben
        res.render('dashboard', {
            pageTitle: 'Mein Dashboard',
            userTicketCount: userTicketCount,
            userTicketNumbers: userTicketNumbers,
            totalSoldTickets: totalSoldTickets,
            maxTickets: maxTickets,
            remainingTickets: remainingTickets,
            username: currentUsername
        });

    } catch (err) {
        console.error('Fehler beim Laden des Dashboards:', err);
        // Fehler an den globalen Fehlerhandler weiterleiten
        // Stellt sicher, dass der Fehlerhandler in app.js eine err.status Eigenschaft hat
        err.status = err.status || 500;
        next(err);
    }
});

module.exports = router;