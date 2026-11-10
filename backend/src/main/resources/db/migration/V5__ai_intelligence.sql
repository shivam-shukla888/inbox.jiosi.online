-- JIOSI Inbox Day 3: Groq AI Intelligence & Email Triage Schema
-- Flyway Migration V5: AI Preferences and Thread Triage Persistence

-- 1. Table: user_ai_preferences
CREATE TABLE IF NOT EXISTS user_ai_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_processing_consent BOOLEAN NOT NULL DEFAULT true,
    default_reply_tone VARCHAR(32) NOT NULL DEFAULT 'professional',
    default_reply_language VARCHAR(32) NOT NULL DEFAULT 'match_thread',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_ai_preferences_user UNIQUE (user_id)
);

-- 2. Table: thread_ai_triage
CREATE TABLE IF NOT EXISTS thread_ai_triage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    category VARCHAR(32) NOT NULL DEFAULT 'unknown',
    user_category_override VARCHAR(32),
    importance_score INT NOT NULL DEFAULT 0,
    importance_reason VARCHAR(500),
    urgency_score INT NOT NULL DEFAULT 0,
    urgency_reason VARCHAR(500),
    needs_reply BOOLEAN NOT NULL DEFAULT false,
    deadline TIMESTAMP WITH TIME ZONE,
    evidence TEXT,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    model_used VARCHAR(100),
    feedback_reported BOOLEAN NOT NULL DEFAULT false,
    feedback_notes VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_thread_ai_triage_thread UNIQUE (thread_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_ai_triage_workspace ON thread_ai_triage(workspace_id);
CREATE INDEX IF NOT EXISTS idx_thread_ai_triage_category ON thread_ai_triage(category);
CREATE INDEX IF NOT EXISTS idx_thread_ai_triage_scores ON thread_ai_triage(workspace_id, importance_score DESC, urgency_score DESC);
