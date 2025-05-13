-- PostgreSQL database schema for Cockpit Portal

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP
);

-- Create default admin user (password: admin123)
-- In production, change this password immediately after installation
INSERT INTO users (username, password, full_name, email, is_admin)
VALUES ('admin', '$2y$10$O34.8eFZKP1YRRmZBLjGcuCGsgBjsmiBELUQOS/VQb1kEpbSAeQF.', 'System Administrator', 'admin@example.com', TRUE);

-- Servers Table
CREATE TABLE IF NOT EXISTS servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    description TEXT,
    port INTEGER NOT NULL DEFAULT 9090,
    username VARCHAR(100) NOT NULL,
    password TEXT NOT NULL, -- Will store encrypted password
    use_ssl BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_accessed TIMESTAMP,
    CONSTRAINT valid_port CHECK (port >= 1 AND port <= 65535)
);

-- Access Logs Table
CREATE TABLE IF NOT EXISTS access_logs (
    id SERIAL PRIMARY KEY,
    server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45), -- To accommodate IPv6 addresses
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX idx_servers_created_by ON servers(created_by);
CREATE INDEX idx_access_logs_server_id ON access_logs(server_id);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_accessed_at ON access_logs(accessed_at);

-- Create or replace view for server statistics
CREATE OR REPLACE VIEW server_statistics AS
SELECT 
    s.id,
    s.name,
    s.hostname,
    COUNT(al.id) as access_count,
    MAX(al.accessed_at) as last_accessed_time,
    (
        SELECT COUNT(*) 
        FROM access_logs 
        WHERE server_id = s.id AND success = FALSE
    ) as failed_access_count
FROM
    servers s
LEFT JOIN
    access_logs al ON s.id = al.server_id
GROUP BY
    s.id, s.name, s.hostname;

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update 'updated_at' column
CREATE TRIGGER update_user_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_server_modtime
BEFORE UPDATE ON servers
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Function to update last_accessed in servers table
CREATE OR REPLACE FUNCTION update_server_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE servers
    SET last_accessed = NEW.accessed_at
    WHERE id = NEW.server_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_accessed when a server is accessed
CREATE TRIGGER update_server_access_time
AFTER INSERT ON access_logs
FOR EACH ROW
EXECUTE FUNCTION update_server_last_accessed();

-- Create table for audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Comments
COMMENT ON TABLE users IS 'Stores user accounts for the Cockpit Portal';
COMMENT ON TABLE servers IS 'Stores Cockpit server connection information';
COMMENT ON TABLE access_logs IS 'Logs all access attempts to Cockpit servers';
COMMENT ON TABLE audit_logs IS 'Tracks all administrative actions in the portal';
COMMENT ON VIEW server_statistics IS 'Provides aggregated access statistics for servers';
