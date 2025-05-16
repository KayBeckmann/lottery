-- Tabelle für Benutzer
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Ändern auf UUID mit Standardwert
    username VARCHAR(100) UNIQUE NOT NULL, -- Behalten des Benutzernamens als UNIQUE
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Ändern auf UUID mit Standardwert
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Verknüpfung zum Benutzer (UUID)
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


-- Beispieldaten für Tickets
-- Die user_id muss nun der tatsächlichen UUID des Benutzers entsprechen.
-- Dies erfordert, dass Sie die UUIDs der eingefügten Benutzer abrufen,
-- oder die Einfügungen in einer einzigen Transaktion/Skriptlogik durchführen.
-- Für dieses Beispiel gehen wir davon aus, dass wir die IDs von 'TestUser' und 'AnotherUser' kennen.
-- Dies ist jedoch in einer echten Anwendung so nicht praktikabel.
-- Sie müssten die IDs nach dem Einfügen der Benutzer dynamisch ermitteln.
-- Führen Sie diese INSERT-Befehle daher NACHDEM die users eingefügt wurden aus
-- und passen Sie die UUIDs entsprechend an.

