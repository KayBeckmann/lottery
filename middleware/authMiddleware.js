// middleware/authMiddleware.js
function ensureAuthenticated(req, res, next) {
    // In der echten App: if (req.isAuthenticated())
    if (req.user) { // Für unsere Simulation
        return next();
    }
    // req.flash('error_msg', 'Bitte melde dich an.'); // Benötigt connect-flash
    console.log('Nicht authentifiziert, Weiterleitung zum Login (später implementiert)');
    res.redirect('/'); // Später: res.redirect('/auth/login');
}

function ensureAdmin(req, res, next) {
    // In der echten App: if (req.isAuthenticated() && req.user.role === 'admin')
    if (req.user && req.user.role === 'admin') { // Für unsere Simulation
        return next();
    }
    // req.flash('error_msg', 'Zugriff verweigert. Admin-Berechtigung erforderlich.');
    console.log('Keine Admin-Berechtigung, Weiterleitung zum Dashboard');
    res.status(403).send('Zugriff verweigert. Nur für Admins.'); // Oder Weiterleitung
    // res.redirect('/dashboard');
}

module.exports = {
    ensureAuthenticated,
    ensureAdmin
};