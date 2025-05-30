// app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session'); // Hinzufügen für Sessions
// const flash = require('connect-flash'); // Hinzufügen für Flash-Nachrichten
// const passport = require('passport'); // Für spätere Passport.js Integration

const dashboardRouter = require('./routes/dashboard');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth'); // Neue Auth-Routen

// // Passport Konfiguration (später, wenn du Passport einrichtest)
// require('./config/passport')(passport); // Annahme: Passport-Konfig in config/passport.js

const app = express();
const port = process.env.PORT || 3000;

// View Engine einrichten (Pug)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
app.use(express.urlencoded({ extended: false })); //
app.use(express.json()); //

// Statische Dateien (CSS, JS, Bilder) aus dem 'public'-Ordner bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'einSehrGeheimesGeheimnis', // In .env speichern!
    resave: false, // true in der Vorlage, aber false ist oft besser
    saveUninitialized: false, // true in der Vorlage, aber false ist oft besser für GDPR
    // cookie: { secure: process.env.NODE_ENV === 'production' } // Nur über HTTPS in Produktion
}));

// // Passport Middleware (nach Session Middleware)
// app.use(passport.initialize());
// app.use(passport.session());

// // Connect Flash Middleware (nach Session)
// app.use(flash());

// Globale Variablen für Pug-Templates
app.use((req, res, next) => {
    // Diese Logik wird durch Passport oder deine manuelle Session-Logik ersetzt
    if (req.session && req.session.user) {
        req.user = req.session.user; // Benutzer aus der Session verfügbar machen
    } else {
        // Simulierte Benutzer für Routen, die noch nicht durch den neuen Login geschützt sind
        // Dies sollte entfernt/angepasst werden, sobald Login voll funktionsfähig ist
        // req.user = {
        //     id: '00000000-0000-0000-0000-000000000002', 
        //     username: 'TestUserNormalPlaceholder',
        //     role: 'user'
        // };
    }
    res.locals.isAuthenticated = !!req.user; // Basierend auf echtem req.user
    res.locals.currentUser = req.user;
    // res.locals.success_msg = req.flash('success_msg');
    // res.locals.error_msg = req.flash('error'); // 'error' ist oft der Standardkey von connect-flash
    // res.locals.error = req.flash('error'); // Passport setzt Fehler oft unter 'error'
    next();
});


// Routen
app.use('/auth', authRouter); // Auth-Routen vor anderen geschützten Routen
app.get('/', (req, res) => {
    res.render('index', { pageTitle: 'Willkommen' });
});
app.use('/dashboard', dashboardRouter); // Hier ensureAuthenticated Middleware einfügen
app.use('/admin', adminRouter); // Hier ensureAuthenticated und ensureAdmin einfügen


// Einfache Fehlerbehandlung
app.use((err, req, res, next) => {
    console.error("Globaler Fehlerhandler:", err.stack);
    res.status(err.status || 500).render('error', {
        pageTitle: 'Fehler',
        message: err.message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});