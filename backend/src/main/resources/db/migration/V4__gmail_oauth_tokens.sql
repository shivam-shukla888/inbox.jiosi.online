-- Flyway Migration V4: Gmail OAuth Token Storage & Sync Metadata
-- Security: Access and refresh tokens are strictly stored encrypted at rest (AES-256-GCM).

ALTER TABLE connected_accounts
    ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS scope VARCHAR(512),
    ADD COLUMN IF NOT EXISTS history_id VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_provider
    ON connected_accounts(user_id, provider);

