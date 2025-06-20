-- Tabelle für Benutzer
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für Ziehungen (Draws)
CREATE TABLE draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    ticket_price DECIMAL(10, 8) NOT NULL, -- Preis pro Ticket in BTC
    processing_fee DECIMAL(10, 8) NOT NULL, -- Bearbeitungsgebühr pro Ticket in BTC
    total_tickets INT NOT NULL, -- Maximale Anzahl an Tickets für diese Ziehung
    status VARCHAR(50) DEFAULT 'open' NOT NULL, -- z.B. 'open', 'closed', 'drawing_complete', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für Einstellungen (globale Einstellungen, falls noch benötigt)
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
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL, -- Verknüpfung zur Ziehung
    ticket_number_in_draw SERIAL, -- Laufende Nummer des Tickets innerhalb der Ziehung
    status VARCHAR(50) DEFAULT 'pending_payment' NOT NULL, -- z.B. 'pending_payment', 'paid', 'cancelled', 'winner'
    payment_instruction_details TEXT, -- Speichert UUID der Ziehung und des Tickets für die Zahlungszuordnung (z.B. als JSON-String)
    assigned_wallet_address VARCHAR(255), -- Die dem User für diese Transaktion zugewiesene Wallet-Adresse
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (draw_id, ticket_number_in_draw) -- Stellt sicher, dass die Ticketnummer pro Ziehung eindeutig ist
);

-- Optional: Index für schnellere Abfragen der Tickets eines Benutzers
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_draw_id ON tickets(draw_id);

-- Beispieldaten für Benutzer mit festen UUIDs
INSERT INTO users (id, username, email, password_hash, role) VALUES
('00000000-0000-0000-0000-000000000001', 'TestAdmin', 'admin@example.com', 'dummyhash_admin', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, username, email, password_hash, role) VALUES
('00000000-0000-0000-0000-000000000002', 'TestUserNormal', 'user@example.com', 'dummyhash_user', 'user')
ON CONFLICT (id) DO NOTHING;

-- Standardeinstellungen (können auch pro Ziehung gesetzt werden)
INSERT INTO settings (setting_key, setting_value) VALUES ('default_ticket_price', '0.001')
ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO settings (setting_key, setting_value) VALUES ('default_processing_fee_btc', '0.0001')
ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO settings (setting_key, setting_value) VALUES ('default_max_tickets_per_draw', '100')
ON CONFLICT (setting_key) DO NOTHING;


-- Beispiel-Ziehung (Draw)
INSERT INTO draws (name, ticket_price, processing_fee, total_tickets, status) VALUES
('Proof of concept', 0.001, 0.0001, 10, 'open')
ON CONFLICT (id) DO NOTHING;

-- Beispieldaten für Tickets (hier manuell, später durch Kaufsystem)
-- Angenommen die obige Ziehung hat eine ID, die wir hier verwenden müssten.
-- Für Testzwecke könnte man die ID nach dem Einfügen abfragen und hier einsetzen.
-- Beispiel: INSERT INTO tickets (user_id, draw_id, status, payment_instruction_details) VALUES
-- ('00000000-0000-0000-0000-000000000002', (SELECT id FROM draws WHERE name = 'Erste Oster Verlosung'), 'paid', '{"draw_uuid": "...", "ticket_uuid": "..."}');
