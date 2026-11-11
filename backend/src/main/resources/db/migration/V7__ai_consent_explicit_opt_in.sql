-- JIOSI Inbox Day 3: Groq AI Intelligence & Email Action Assistant
-- Flyway Migration V7: Enforce strict explicit opt-in for Groq AI processing consent

-- 1. Alter table column default to false (strict explicit opt-in for all newly created rows)
ALTER TABLE user_ai_preferences ALTER COLUMN ai_processing_consent SET DEFAULT false;

-- 2. Reset existing preference records to explicit false to prevent unconfirmed implicit opt-ins
UPDATE user_ai_preferences SET ai_processing_consent = false, updated_at = CURRENT_TIMESTAMP WHERE ai_processing_consent = true;

