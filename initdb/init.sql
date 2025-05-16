-- Tabelle für Benutzer
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für Einstellungen (z.B. maximale Anzahl an Tickets)
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für den Wallet-Pool (importierte, noch nicht zugewiesene Adressen)
CREATE TABLE IF NOT EXISTS wallet_pool (
    id SERIAL PRIMARY KEY,
    btc_address VARCHAR(255) UNIQUE NOT NULL,
    is_assigned BOOLEAN DEFAULT FALSE,
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP WITH TIME ZONE
);

-- Tabelle für Tickets/Lose
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    ticket_number SERIAL UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'paid' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Index für schnellere Abfragen der Tickets eines Benutzers
CREATE INDEX idx_tickets_user_id ON tickets(user_id);

-- Beispieldaten für Benutzer mit festen UUIDs
INSERT INTO users (id, username, email, password_hash, role) VALUES
('00000000-0000-0000-0000-000000000001', 'TestAdmin', 'admin@example.com', 'dummyhash_admin', 'admin')
ON CONFLICT (id) DO NOTHING; -- Verhindert Fehler, falls schon vorhanden (alternativ ON CONFLICT (username) DO NOTHING)

INSERT INTO users (id, username, email, password_hash, role) VALUES
('00000000-0000-0000-0000-000000000002', 'TestUserNormal', 'user@example.com', 'dummyhash_user', 'user')
ON CONFLICT (id) DO NOTHING;

-- Standardwert für maximale Tickets einfügen
INSERT INTO settings (setting_key, setting_value) VALUES ('max_tickets', '100')
ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO settings (setting_key, setting_value) VALUES ('btc_ticket_price', '0.001')
ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO settings (setting_key, setting_value) VALUES ('processing_fee_btc', '0.0001')
ON CONFLICT (setting_key) DO NOTHING;


-- Beispieldaten für Tickets, die auf die oben definierten UUIDs verweisen
INSERT INTO tickets (user_id, status) VALUES
('00000000-0000-0000-0000-000000000001', 'paid'), -- Ticket für TestAdmin
('00000000-0000-0000-0000-000000000001', 'paid'), -- Noch ein Ticket für TestAdmin
('00000000-0000-0000-0000-000000000002', 'paid'); -- Ticket für TestUserNormal