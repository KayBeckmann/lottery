require('dotenv').config();
const express = require('express');
const path = require('path');
const dashboardRouter = require('./routes/dashboard');
const adminRouter = require('./routes/admin'); // Admin-Routen

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
// Diese Middleware fügt ein simuliertes Benutzerobjekt zu req hinzu
// In einer echten Anwendung würde dies von Passport.js oder einer ähnlichen Bibliothek gehandhabt
app.use((req, res, next) => {
    // Simuliere einen Admin-Benutzer mit einer festen UUID für Tests
    req.user = {
        id: '00000000-0000-0000-0000-000000000001', // Feste UUID für TestAdmin
        username: 'TestAdmin',
        role: 'admin'
        // Um einen normalen Benutzer zu simulieren (andere UUID verwenden, die in init.sql existiert):
        // id: '00000000-0000-0000-0000-000000000002',
        // username: 'TestUserNormal',
        // role: 'user'
    };
    // Simuliert req.isAuthenticated() - wird true, wenn req.user existiert
    req.isAuthenticated = () => !!req.user;
    next();
});

// Globale Variablen für Pug-Templates
// Diese Middleware stellt `isAuthenticated` und `currentUser` allen Pug-Templates zur Verfügung
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated(); // Boolean
    res.locals.currentUser = req.user; // Das simulierte User-Objekt
    next();
});
// --- ENDE SIMULATION AUTHENTIFIZIERUNG ---


// Routen
app.get('/', (req, res) => {
    res.render('index', { pageTitle: 'Willkommen' });
});
app.use('/dashboard', dashboardRouter);
app.use('/admin', adminRouter); // Admin-Routen verwenden

// Einfache Fehlerbehandlung (kann später verfeinert werden)
app.use((err, req, res, next) => {
    console.error("Globaler Fehlerhandler:", err); // Gibt den Stack Trace in der Konsole aus
    // Für den Client eine generische Fehlermeldung senden
    // In der Entwicklungsumgebung möchtest du vielleicht mehr Details senden
    res.status(err.status || 500).render('error', {
        pageTitle: 'Fehler',
        message: err.message,
        // In der Entwicklung: error: err (um den Stack Trace im Browser zu sehen)
        // In Produktion: error: {} (um keine sensiblen Details preiszugeben)
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});