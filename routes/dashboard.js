const express = require('express');
const router = express.Router();
const db = require('../db'); // Unser Datenbankmodul

// Dashboard-Route
router.get('/', async (req, res, next) => {
    if (!req.user || !req.user.id) {
        console.error("Dashboard: req.user oder req.user.id nicht verfügbar.");
        return res.status(401).send('Nicht authentifiziert. Bitte zuerst anmelden.');
    }

    const currentUserId = req.user.id;
    const currentUsername = req.user.username;

    try {
        // 1. Aktive Ziehungen laden, für die der Benutzer Tickets kaufen kann
        const openDrawsResult = await db.query(
            `SELECT d.id, d.name, d.ticket_price, d.processing_fee, d.total_tickets, d.status,
                    (d.total_tickets - COALESCE(COUNT(t.id), 0)) AS remaining_tickets_in_draw,
                    COALESCE(COUNT(t.id), 0) as sold_tickets_in_draw
             FROM draws d
             LEFT JOIN tickets t ON d.id = t.draw_id AND t.status = 'paid'
             WHERE d.status = 'open'
             GROUP BY d.id, d.name, d.ticket_price, d.processing_fee, d.total_tickets, d.status
             ORDER BY d.created_at DESC`
        );
        const openDraws = openDrawsResult.rows;

        // 2. Gekaufte Tickets des Benutzers für alle Ziehungen
        const userTicketsResult = await db.query(
            `SELECT t.id as ticket_id, t.ticket_number_in_draw, t.status as ticket_status, t.created_at as purchase_date,
                    d.id as draw_id, d.name as draw_name, d.status as draw_status
             FROM tickets t
             JOIN draws d ON t.draw_id = d.id
             WHERE t.user_id = $1
             ORDER BY d.created_at DESC, t.ticket_number_in_draw ASC`,
            [currentUserId]
        );
        const userTicketsByDraw = userTicketsResult.rows.reduce((acc, ticket) => {
            if (!acc[ticket.draw_id]) {
                acc[ticket.draw_id] = {
                    draw_id: ticket.draw_id,
                    draw_name: ticket.draw_name,
                    draw_status: ticket.draw_status,
                    tickets: []
                };
            }
            acc[ticket.draw_id].tickets.push({
                ticket_id: ticket.ticket_id,
                number: ticket.ticket_number_in_draw,
                status: ticket.ticket_status,
                purchase_date: ticket.purchase_date
            });
            return acc;
        }, {});

        res.render('dashboard', {
            pageTitle: 'Mein Dashboard',
            username: currentUsername,
            openDraws: openDraws,
            userTicketsByDraw: Object.values(userTicketsByDraw) // Als Array übergeben für einfachere Iteration im Template
        });

    } catch (err) {
        console.error('Fehler beim Laden des Dashboards:', err);
        err.status = err.status || 500;
        next(err);
    }
});

module.exports = router;
