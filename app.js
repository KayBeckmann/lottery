require('dotenv').config();
const express = require('express');
const path = require('path');
const dashboardRouter = require('./routes/dashboard'); // Erstellen wir gleich

const app = express();
const port = process.env.PORT || 3000;

// View Engine einrichten (Pug)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware für statische Dateien (optional für jetzt)
// app.use(express.static(path.join(__dirname, 'public')));

// Middleware zum Parsen von URL-kodierten Daten (für Formulare)
app.use(express.urlencoded({ extended: false }));
// Middleware zum Parsen von JSON-Daten
app.use(express.json());

// Routen
app.get('/', (req, res) => {
    // Später hier eine richtige Homepage oder Weiterleitung zum Login/Dashboard
    res.render('index', { pageTitle: 'Willkommen' });
});
app.use('/dashboard', dashboardRouter);

// Einfache Fehlerbehandlung
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Etwas ist schiefgelaufen!');
});

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});
