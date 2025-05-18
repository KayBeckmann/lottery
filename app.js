require('dotenv').config();
const express = require('express');
const path = require('path');
const dashboardRouter = require('./routes/dashboard');
const adminRouter = require('./routes/admin'); // Admin-Routen
// const ticketRouter = require('./routes/tickets'); // Potenzielle neue Route für Ticket-Operationen

const app = express();
const port = process.env.PORT || 3000;

// View Engine einrichten (Pug)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware zum Parsen von URL-kodierten Daten (für Formulare)
app.use(express.urlencoded({ extended: false }));
// Middleware zum Parsen von JSON-Daten
app.use(express.json());

// --- SIMULATION AUTHENTIFIZIERUNG ---
app.use((req, res, next) => {
    req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        username: 'TestAdmin',
        role: 'admin'
        // id: '00000000-0000-0000-0000-000000000002',
        // username: 'TestUserNormal',
        // role: 'user'
    };
    req.isAuthenticated = () => !!req.user;
    next();
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.currentUser = req.user;
    // Hier könntest du connect-flash Middleware einbinden, falls du es verwendest
    // res.locals.success_msg = req.flash('success_msg');
    // res.locals.error_msg = req.flash('error_msg');
    next();
});
// --- ENDE SIMULATION AUTHENTIFIZIERUNG ---


// Routen
app.get('/', (req, res) => {
    // Logik für die Startseite, evtl. Anzeige aktiver Ziehungen
    res.render('index', { pageTitle: 'Willkommen zu BTC Verlosungen' });
});
app.use('/dashboard', dashboardRouter);
app.use('/admin', adminRouter);
// app.use('/tickets', ticketRouter); // Wenn du Ticket-Operationen auslagerst

// Fehlerbehandlung
app.use((err, req, res, next) => {
    console.error("Globaler Fehlerhandler:", err);
    res.status(err.status || 500).render('error', {
        pageTitle: 'Fehler',
        message: err.message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});
