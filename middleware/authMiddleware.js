function ensureAuthenticated(req, res, next) {
    if (req.user) { 
        return next();
    }
    // req.flash('error_msg', 'Bitte melde dich an.'); 
    console.log('Nicht authentifiziert, Weiterleitung zum Login (später implementiert)');
    res.redirect('/'); // Später: res.redirect('/auth/login');
}

function ensureAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') { 
        return next();
    }
    // req.flash('error_msg', 'Zugriff verweigert. Admin-Berechtigung erforderlich.');
    console.log('Keine Admin-Berechtigung, Weiterleitung zum Dashboard');
    res.status(403).send('Zugriff verweigert. Nur für Admins.'); 
    // res.redirect('/dashboard');
}

module.exports = {
    ensureAuthenticated,
    ensureAdmin
};
