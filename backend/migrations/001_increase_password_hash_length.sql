-- Migration: Increase password_hash and api_key_hash column sizes
-- Date: 2026-02-08
-- Reason: Scrypt hashes are 146+ characters, but columns were only 128

-- Increase password_hash column size
ALTER TABLE user MODIFY COLUMN password_hash VARCHAR(255);

-- Increase api_key_hash column size
ALTER TABLE user MODIFY COLUMN api_key_hash VARCHAR(255);
