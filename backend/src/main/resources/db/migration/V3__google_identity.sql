-- JIOSI Inbox Day 2 Schema Migration
-- Flyway Migration V3: Google Identity & OIDC Authentication

-- Add Google identity fields and verification tracking to users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS google_subject VARCHAR(255),
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) NOT NULL DEFAULT 'LOCAL';

-- Unique constraint on google_subject (allowing nulls for legacy/local users)
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_google_subject ON users(google_subject) WHERE google_subject IS NOT NULL;

-- Fast index for looking up users by auth provider and subject
CREATE INDEX IF NOT EXISTS idx_users_provider_subject ON users(auth_provider, google_subject);
