require('dotenv').config();
const express = require('express');
const path = require('path');
const dashboardRouter = require('./routes/dashboard');
const adminRouter = require('./routes/admin'); // Erstellen wir gleich

const app = express();
const port = process.env.PORT || 3000;

// View Engine einrichten (Pug)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// --- SIMULATION AUTHENTIFIZIERUNG ---
// Diese Middleware fügt ein simuliertes Benutzerobjekt zu req hinzu
// In einer echten Anwendung würde dies von Passport.js oder einer ähnlichen Bibliothek gehandhabt
app.use((req, res, next) => {
    // Simuliere einen Admin-Benutzer
    req.user = {
        id: '00000000-0000-0000-0000-000000000001', // Beispiel UUID für TestUser
        // Um einen Admin zu simulieren:
        username: 'TestAdmin',
        role: 'admin'
        // Um einen normalen Benutzer zu simulieren:
        // username: 'TestUser',
        // role: 'user'
    };
    req.isAuthenticated = () => !!req.user; // Simuliert req.isAuthenticated()
    next();
});

// Globale Variablen für Pug-Templates
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.currentUser = req.user; // currentUser wird in Templates verfügbar
    next();
});
// --- ENDE SIMULATION AUTHENTIFIZIERUNG ---


// Routen
app.get('/', (req, res) => {
    res.render('index', { pageTitle: 'Willkommen' });
});
app.use('/dashboard', dashboardRouter);
app.use('/admin', adminRouter); // Admin-Routen hinzufügen

// Einfache Fehlerbehandlung
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Etwas ist schiefgelaufen!');
});

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});
