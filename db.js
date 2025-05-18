require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: {
    //   rejectUnauthorized: false
    // }
});

pool.on('connect', () => {
    console.log('Erfolgreich mit der Datenbank verbunden!');
});

pool.on('error', (err) => {
    console.error('Unerwarteter Fehler im PostgreSQL Client Pool', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool: pool,
};
