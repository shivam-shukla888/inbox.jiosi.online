-- JIOSI Inbox Day 4: Small Business Email Action Assistant Schema
-- Flyway Migration V6: Business Profiles, Commitments & Daily Brief Cache

-- 1. Table: user_business_profiles
CREATE TABLE IF NOT EXISTS user_business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    profile_type VARCHAR(64) NOT NULL DEFAULT 'generic',
    business_name VARCHAR(255),
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    business_hours_start VARCHAR(10) NOT NULL DEFAULT '09:00',
    business_hours_end VARCHAR(10) NOT NULL DEFAULT '18:00',
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT true,
    quiet_hours_start VARCHAR(10) NOT NULL DEFAULT '20:00',
    quiet_hours_end VARCHAR(10) NOT NULL DEFAULT '08:00',
    vip_contacts TEXT,
    waiting_on_contacts TEXT,
    daily_brief_time VARCHAR(10) NOT NULL DEFAULT '08:30',
    summary_language VARCHAR(32) NOT NULL DEFAULT 'match_thread',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_business_profiles UNIQUE (user_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_user_business_profiles_ws ON user_business_profiles(workspace_id);

-- 2. Table: email_commitments
CREATE TABLE IF NOT EXISTS email_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_message_id VARCHAR(255),
    actor VARCHAR(32) NOT NULL DEFAULT 'unknown',
    action VARCHAR(500) NOT NULL,
    target VARCHAR(255),
    due_date TIMESTAMP WITH TIME ZONE,
    evidence_quote TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'open',
    user_status_override VARCHAR(32),
    audit_note VARCHAR(500),
    fingerprint VARCHAR(255) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_commitments_ws_status ON email_commitments(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_email_commitments_thread ON email_commitments(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_commitments_fingerprint ON email_commitments(workspace_id, fingerprint);

-- 3. Table: daily_brief_cache
CREATE TABLE IF NOT EXISTS daily_brief_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    brief_date VARCHAR(32) NOT NULL,
    brief_json TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_daily_brief_cache UNIQUE (user_id, workspace_id, brief_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_brief_cache_ws ON daily_brief_cache(workspace_id);
