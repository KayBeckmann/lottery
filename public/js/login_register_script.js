// public/js/login_register_script.js
const container = document.getElementById('container-auth'); // Angepasste ID
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

if (registerBtn && loginBtn && container) { // Null-Check hinzufügen
    registerBtn.addEventListener('click', () => {
        container.classList.add("active");
    });

    loginBtn.addEventListener('click', () => {
        container.classList.remove("active");
    });
} else {
    if (!container) console.error('Auth Container not found');
    if (!registerBtn) console.error('Register button not found');
    if (!loginBtn) console.error('Login button not found');
}