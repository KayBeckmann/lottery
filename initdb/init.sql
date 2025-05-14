-- Tabelle für Benutzer
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Für später (Login)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für Einstellungen (z.B. maximale Anzahl an Tickets)
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für Tickets/Lose
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Verknüpfung zum Benutzer
    ticket_number SERIAL UNIQUE NOT NULL, -- Eindeutige Losnummer (automatisch generiert)
    status VARCHAR(50) DEFAULT 'paid' NOT NULL, -- z.B. 'paid', 'pending_payment'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Index für schnellere Abfragen der Tickets eines Benutzers
CREATE INDEX idx_tickets_user_id ON tickets(user_id);

-- Standardwert für maximale Tickets einfügen (kann später geändert werden)
INSERT INTO settings (setting_key, setting_value) VALUES ('max_tickets', '100')
ON CONFLICT (setting_key) DO NOTHING; -- Fügt nur ein, wenn der Schlüssel noch nicht existiert

-- Beispieldaten für einen Benutzer (Passwort ist nur ein Platzhalter, da Login später kommt)
INSERT INTO users (username, email, password_hash) VALUES ('TestUser', 'test@example.com', 'dummyhash123')
ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, email, password_hash) VALUES ('AnotherUser', 'another@example.com', 'dummyhash456')
ON CONFLICT (username) DO NOTHING;


-- Beispieldaten für Tickets (angenommen, user mit id 1 existiert)
-- (Führe dies aus, NACHDEM du einen Benutzer mit ID 1 erstellt hast oder passe die user_id an)
-- Um sicherzugehen, dass user_id=1 existiert:
-- WITH user_one AS (SELECT id FROM users WHERE username = 'TestUser' LIMIT 1)
-- INSERT INTO tickets (user_id, status)
-- SELECT id, 'paid' FROM user_one
-- ON CONFLICT DO NOTHING; -- Fügt nur ein, wenn das Ticket nicht schon existiert (basierend auf ticket_number, was hier aber nicht spezifiziert ist)

-- Besser: Manuell IDs prüfen oder dynamisch einfügen, wenn du das Skript mehrfach ausführst.
-- Für den ersten Durchlauf ist es einfacher, wenn du die User-IDs kennst.
-- Angenommen, 'TestUser' hat die ID 1 und 'AnotherUser' die ID 2 nach den obigen Inserts:
INSERT INTO tickets (user_id, status) VALUES (1, 'paid');
INSERT INTO tickets (user_id, status) VALUES (1, 'paid');
INSERT INTO tickets (user_id, status) VALUES (2, 'paid');
