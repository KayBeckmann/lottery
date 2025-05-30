// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Für Passwort-Hashing (npm install bcryptjs)
const db = require('../db'); // Dein Datenbankmodul

// Login/Register Seite anzeigen
router.get('/login', (req, res) => {
    // Flash-Nachrichten könnten hier ausgelesen und übergeben werden, falls implementiert
    // const errorMessages = req.flash('error');
    // const successMessages = req.flash('success_msg');
    res.render('auth/login_register', { 
        pageTitle: 'Anmelden / Registrieren',
        // error: errorMessages,
        // success_msg: successMessages,
        layout: 'layout_bare' // Stellt sicher, dass das minimalistische Layout verwendet wird
    });
});

// Registrierungs-Logik (POST)
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    let errors = []; // Hier könnten Validierungsfehler gesammelt werden

    // Einfache Validierung
    if (!name || !email || !password) {
        errors.push({ msg: 'Bitte alle Felder ausfüllen.' });
    }
    if (password && password.length < 6) { // Beispiel für Passwortlänge
        errors.push({ msg: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
    }
    // Weitere Validierungen hier (z.B. E-Mail-Format)

    if (errors.length > 0) {
        // console.log("Registrierungsfehler (Validierung):", errors);
        // req.flash('error', errors.map(e => e.msg)); // Mehrere Fehler als Array übergeben oder joinen
        // In der login_register.pug müssten die Flash-Nachrichten dann angezeigt werden.
        // Temporär: Einfach Log und Redirect
        console.log('Validierungsfehler bei Registrierung:', errors.map(e => e.msg).join(', '));
        return res.redirect('/auth/login'); // Zurück zum Formular, idealerweise mit Fehleranzeige
    }

    try {
        // Prüfen, ob Benutzer bereits existiert (optional, DB Constraint fängt es auch ab)
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            console.log('E-Mail bereits registriert:', email);
            // req.flash('error', 'Diese E-Mail-Adresse ist bereits registriert.');
            return res.redirect('/auth/login');
        }

        // Passwort hashen
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Neuen Benutzer in der Datenbank speichern
        const newUser = await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, email, hashedPassword, 'user']
        );
        
        console.log('Benutzer erfolgreich registriert mit ID:', newUser.rows[0].id);
        // req.flash('success_msg', 'Registrierung erfolgreich! Du kannst dich jetzt anmelden.');
        res.redirect('/auth/login#login-form'); // Zum Anmeldeformular springen (der #login-form Teil)

    } catch (dbErr) {
        console.error('Fehler beim Speichern des Benutzers:', dbErr);
        // req.flash('error', 'Bei der Registrierung ist ein Serverfehler aufgetreten.');
        res.redirect('/auth/login');
    }
});

// Login-Logik (POST)
router.post('/login', async (req, res, next) => { // async für spätere DB-Operationen
    const { email, password } = req.body;
    console.log('Anmeldeversuch:', { email, password });

    if (!email || !password) {
        console.log('Login fehlgeschlagen, Felder fehlen.');
        // req.flash('error', 'Bitte E-Mail und Passwort eingeben.');
        return res.redirect('/auth/login');
    }

    // Dummy-Logik (sollte durch echte Datenbankprüfung ersetzt werden)
    if (email === "admin@example.com" && password === "adminpass") {
        console.log('Admin-Login erfolgreich (Dummy).');
        req.session.user = { 
            id: '00000000-0000-0000-0000-000000000001', // Feste Admin UUID
            username: 'TestAdmin', // Aus init.sql
            email: email, 
            role: 'admin' 
        };
        // req.flash('success_msg', 'Erfolgreich als Admin angemeldet.');
        return res.redirect('/admin');
    } else if (email === "user@example.com" && password === "userpass") {
        console.log('User-Login erfolgreich (Dummy).');
        req.session.user = { 
            id: '00000000-0000-0000-0000-000000000002', // Feste User UUID
            username: 'TestUserNormal', // Aus init.sql
            email: email, 
            role: 'user' 
        };
        // req.flash('success_msg', 'Erfolgreich angemeldet.');
        return res.redirect('/dashboard');
    }

    // TODO: Echte Benutzerauthentifizierung mit Datenbank
    // 1. Benutzer anhand der E-Mail aus der Datenbank laden
    // 2. Wenn Benutzer gefunden, bcrypt.compare(password, user.password_hash) verwenden
    // 3. Wenn Passwörter übereinstimmen, req.session.user setzen und weiterleiten
    // 4. Sonst Fehlermeldung
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (isMatch) {
                console.log(`Login erfolgreich für echten Benutzer: ${user.username}`);
                req.session.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                };
                // req.flash('success_msg', 'Erfolgreich angemeldet.');
                if (user.role === 'admin') {
                    return res.redirect('/admin');
                } else {
                    return res.redirect('/dashboard');
                }
            } else {
                console.log('Login fehlgeschlagen (Passwort falsch) für:', email);
                // req.flash('error', 'E-Mail oder Passwort ist falsch.');
                return res.redirect('/auth/login');
            }
        } else {
            console.log('Login fehlgeschlagen (Benutzer nicht gefunden) für:', email);
            // req.flash('error', 'E-Mail oder Passwort ist falsch.');
            return res.redirect('/auth/login');
        }
    } catch (dbErr) {
        console.error('Datenbankfehler beim Login:', dbErr);
        // req.flash('error', 'Beim Login ist ein Serverfehler aufgetreten.');
        return res.redirect('/auth/login');
    }
});

// Logout-Logik
router.get('/logout', (req, res, next) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Fehler beim Zerstören der Session:', err);
                return next(err); // Fehler an den globalen Fehlerhandler weiterleiten
            }
            // Standardmäßig wird kein Cookie 'connect.sid' manuell gelöscht,
            // express-session kümmert sich darum oder der Browser löscht es bei Session-Ende.
            // res.clearCookie('connect.sid'); // Nur wenn unbedingt nötig und der Name bekannt ist.
            console.log('Benutzer abgemeldet.');
            // req.flash('success_msg', 'Du wurdest erfolgreich abgemeldet.');
            res.redirect('/auth/login');
        });
    } else {
        // Falls aus irgendeinem Grund keine Session existiert, einfach weiterleiten
        console.log('Benutzer abgemeldet (keine Session vorhanden).');
        res.redirect('/auth/login');
    }
});

module.exports = router;