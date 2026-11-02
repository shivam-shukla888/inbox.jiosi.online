-- JIOSI Inbox Day 2 Schema Migration
-- Flyway Migration V2: Production-Grade Email Domain & Real Workflows

-- Enable trigram extension for efficient fuzzy/substring email search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Extend connected_accounts with workspace association
ALTER TABLE connected_accounts
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_connected_accounts_workspace ON connected_accounts(workspace_id);

-- 2. Table: email_threads (aggregates multi-message conversations with status tracking)
CREATE TABLE IF NOT EXISTS email_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    account_id UUID REFERENCES connected_accounts(id) ON DELETE SET NULL,
    external_thread_id VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    snippet VARCHAR(1000) NOT NULL DEFAULT '',
    sender_name VARCHAR(150) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    sender_avatar VARCHAR(512),
    sender_role VARCHAR(100),
    recipient_name VARCHAR(150),
    recipient_email VARCHAR(255) NOT NULL,
    is_unread BOOLEAN NOT NULL DEFAULT true,
    is_starred BOOLEAN NOT NULL DEFAULT false,
    is_needs_reply BOOLEAN NOT NULL DEFAULT false,
    is_snoozed BOOLEAN NOT NULL DEFAULT false,
    snoozed_until TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    is_sent BOOLEAN NOT NULL DEFAULT false,
    is_draft BOOLEAN NOT NULL DEFAULT false,
    last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    message_count INT NOT NULL DEFAULT 1,
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes for Inbox Query Workflows
CREATE INDEX IF NOT EXISTS idx_threads_workspace_inbox
    ON email_threads(workspace_id, is_archived, is_snoozed, is_sent, is_draft, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_threads_workspace_needs_reply
    ON email_threads(workspace_id, is_needs_reply, is_archived, is_sent, is_draft, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_threads_workspace_starred
    ON email_threads(workspace_id, is_starred, is_archived, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_threads_workspace_snoozed
    ON email_threads(workspace_id, is_snoozed, snoozed_until);

CREATE INDEX IF NOT EXISTS idx_threads_workspace_folder
    ON email_threads(workspace_id, is_archived, is_sent, is_draft, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_threads_account_external
    ON email_threads(account_id, external_thread_id);

-- Trigram index for ultra-fast full search across subject, snippet, and sender
CREATE INDEX IF NOT EXISTS idx_threads_search_trgm
    ON email_threads USING gin ((subject || ' ' || snippet || ' ' || sender_name || ' ' || sender_email) gin_trgm_ops);

-- 3. Table: thread_tags (normalized labels/tags for threads)
CREATE TABLE IF NOT EXISTS thread_tags (
    thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
    tag VARCHAR(64) NOT NULL,
    PRIMARY KEY (thread_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_thread_tags_tag ON thread_tags(tag, thread_id);

-- 4. Table: thread_action_items (extracted action items for threads)
CREATE TABLE IF NOT EXISTS thread_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
    item_text VARCHAR(500) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_thread_action_items_thread ON thread_action_items(thread_id, position ASC);

-- 5. Table: emails (individual messages belonging to a thread)
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
    account_id UUID REFERENCES connected_accounts(id) ON DELETE SET NULL,
    external_message_id VARCHAR(255),
    sender_name VARCHAR(150) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    sender_avatar VARCHAR(512),
    recipient_name VARCHAR(150),
    recipient_email VARCHAR(255) NOT NULL,
    cc TEXT,
    bcc TEXT,
    subject VARCHAR(500) NOT NULL,
    snippet VARCHAR(1000) NOT NULL DEFAULT '',
    body_text TEXT NOT NULL,
    body_html TEXT,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_account_external_message UNIQUE (account_id, external_message_id)
);

CREATE INDEX IF NOT EXISTS idx_emails_thread_sent ON emails(thread_id, sent_at ASC);
CREATE INDEX IF NOT EXISTS idx_emails_workspace ON emails(workspace_id);

-- 6. Table: email_attachments
CREATE TABLE IF NOT EXISTS email_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON email_attachments(email_id);

-- 7. Table: email_drafts (persistent drafts)
CREATE TABLE IF NOT EXISTS email_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    thread_id UUID REFERENCES email_threads(id) ON DELETE SET NULL,
    to_email VARCHAR(255),
    recipient_name VARCHAR(150),
    subject VARCHAR(500),
    body TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drafts_workspace ON email_drafts(workspace_id, updated_at DESC);

-- =========================================================================
-- SEED INITIAL SYNTHETIC DEMONSTRATION WORKSPACE & THREAD RECORDS
-- =========================================================================

-- Primary User
INSERT INTO users (id, email, full_name, avatar_url, created_at, updated_at)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'alex@jiosi.online',
    'Alex Rivera',
    'AR',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Primary Workspace
INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'JIOSI Primary Workspace',
    'primary',
    'b0000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (slug) DO NOTHING;

-- Workspace Membership
INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at, updated_at)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'OWNER',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Primary Connected Account
INSERT INTO connected_accounts (id, user_id, workspace_id, provider, email_address, status, last_sync_at, created_at, updated_at)
VALUES (
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'gmail',
    'alex@jiosi.online',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (user_id, provider, email_address) DO UPDATE SET workspace_id = EXCLUDED.workspace_id;

-- Thread 1: Sarah Jenkins (Kinto Ventures)
INSERT INTO email_threads (
    id, workspace_id, account_id, external_thread_id, subject, snippet,
    sender_name, sender_email, sender_avatar, sender_role, recipient_name, recipient_email,
    is_unread, is_starred, is_needs_reply, is_snoozed, is_archived, is_sent, is_draft,
    last_message_at, message_count, ai_summary, created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'ext-thread-001',
    'Q3 Seed Extension Term Sheet & Cap Table updates',
    'Alex, attached is the revised terms and the pro-forma model with the adjusted dilution numbers from our partner meeting yesterday...',
    'Sarah Jenkins', 'sarah@kinto.ventures', 'SJ', 'General Partner, Kinto',
    'Alex Rivera', 'alex@jiosi.online',
    true, true, true, false, false, false, false,
    CURRENT_TIMESTAMP - INTERVAL '1 hour', 1,
    'Kinto Ventures confirmed leading the $18M cap seed extension. Sarah updated pro-rata allocations and requests your team review the clean term sheet and schedule a closing call for Thursday 2:00 PM PT.',
    CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO emails (
    id, workspace_id, thread_id, account_id, external_message_id,
    sender_name, sender_email, sender_avatar, recipient_name, recipient_email,
    cc, subject, snippet, body_text, sent_at, created_at, updated_at
) VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'msg-001@kinto.ventures',
    'Sarah Jenkins', 'sarah@kinto.ventures', 'SJ', 'Alex Rivera', 'alex@jiosi.online',
    'legal@kinto.ventures, cfo@jiosi.online',
    'Q3 Seed Extension Term Sheet & Cap Table updates',
    'Alex, attached is the revised terms and the pro-forma model with the adjusted dilution numbers from our partner meeting yesterday...',
    'Hi Alex,

Following our partner review yesterday, we are excited to move forward with the lead participation in JIOSI''s seed extension round.

Key updates to the term sheet:
1. Pre-money valuation aligned with our agreed term ($18M cap).
2. Pro-rata allocation expanded for strategic syndicate members.
3. Counsel sign-off on the standard NVCA documentation set.

Please review the attached term sheet clean copy and the dilution sensitivity tab in the spreadsheet. If everything aligns with your board''s expectations, let''s schedule the closing call for Thursday at 2:00 PM PT.

Best regards,
Sarah Jenkins
General Partner | Kinto Ventures',
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO thread_tags (thread_id, tag) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'Fundraising'),
    ('d0000000-0000-0000-0000-000000000001', 'VIP')
ON CONFLICT (thread_id, tag) DO NOTHING;

INSERT INTO thread_action_items (id, thread_id, item_text, position) VALUES
    ('10000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Review clean term sheet (v4) with company counsel', 0),
    ('10000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Confirm closing call availability for Thursday 2:00 PM PT', 1),
    ('10000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Send updated board resolution sign-off', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO email_attachments (id, email_id, filename, size_bytes, content_type) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Term_Sheet_v4_Clean.pdf', 2516582, 'application/pdf'),
    ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'CapTable_Model_Q3.xlsx', 860160, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
ON CONFLICT (id) DO NOTHING;

-- Thread 2: David Vance (Linear Labs)
INSERT INTO email_threads (
    id, workspace_id, account_id, external_thread_id, subject, snippet,
    sender_name, sender_email, sender_avatar, sender_role, recipient_name, recipient_email,
    is_unread, is_starred, is_needs_reply, is_snoozed, is_archived, is_sent, is_draft,
    last_message_at, message_count, ai_summary, created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'ext-thread-002',
    'Design critique notes: keyboard-first UX guidelines',
    'Really loved the command palette rhythm. Left 4 comments in Figma regarding token contrast, focus rings, and list density...',
    'David Vance', 'david@linearlabs.design', 'DV', 'Head of Design, Linear Labs',
    'Alex Rivera', 'alex@jiosi.online',
    true, false, true, false, false, false, false,
    CURRENT_TIMESTAMP - INTERVAL '3 hours', 1,
    'David reviewed the JIOSI prototype and praised the purple accent and keyboard flow. He recommended keeping palette latency under 30ms and reserving red indicators strictly for urgent reply states.',
    CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO emails (
    id, workspace_id, thread_id, account_id, external_message_id,
    sender_name, sender_email, sender_avatar, recipient_name, recipient_email,
    subject, snippet, body_text, sent_at, created_at, updated_at
) VALUES (
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'msg-002@linearlabs.design',
    'David Vance', 'david@linearlabs.design', 'DV', 'Alex Rivera', 'alex@jiosi.online',
    'Design critique notes: keyboard-first UX guidelines',
    'Really loved the command palette rhythm. Left 4 comments in Figma regarding token contrast, focus rings, and list density...',
    'Alex,

I had an hour to play with the latest prototype. The visual calm is definitely there—the indigo/purple accent (#6366F1) with subtle slate borders (#E2E8F0) feels very grounded and non-fatiguing.

A few quick observations:
- Command palette latency feels great. Keep it under 30ms.
- The KBD shortcuts (C, E, H, R) should have slight focus elevation for keyboard power users.
- The 3-panel responsive collapse looks sharp on 14-inch screens.
- Red action indicators for "Needs Reply" should be preserved exclusively for actionable urgency.

Left detailed notes in the Figma frame. Ping me when you push the next iteration!

Cheers,
David',
    CURRENT_TIMESTAMP - INTERVAL '3 hours',
    CURRENT_TIMESTAMP - INTERVAL '3 hours',
    CURRENT_TIMESTAMP - INTERVAL '3 hours'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO thread_tags (thread_id, tag) VALUES
    ('d0000000-0000-0000-0000-000000000002', 'Design'),
    ('d0000000-0000-0000-0000-000000000002', 'Feedback')
ON CONFLICT (thread_id, tag) DO NOTHING;

INSERT INTO thread_action_items (id, thread_id, item_text, position) VALUES
    ('10000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'Inspect Figma frame comments for focus elevation tokens', 0),
    ('10000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'Benchmark command palette keyboard shortcut response', 1)
ON CONFLICT (id) DO NOTHING;

-- Thread 3: Stripe Billing
INSERT INTO email_threads (
    id, workspace_id, account_id, external_thread_id, subject, snippet,
    sender_name, sender_email, sender_avatar, sender_role, recipient_name, recipient_email,
    is_unread, is_starred, is_needs_reply, is_snoozed, is_archived, is_sent, is_draft,
    last_message_at, message_count, ai_summary, created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'ext-thread-003',
    'Invoice #INV-2024-8924 paid ($1,420.00)',
    'Your subscription for JIOSI Team Tier renewed successfully. Next billing cycle begins December 1, 2026...',
    'Stripe Billing', 'notifications@stripe.com', 'SB', 'Automated Billing',
    'Alex Rivera', 'billing@jiosi.online',
    false, false, false, false, false, false, false,
    CURRENT_TIMESTAMP - INTERVAL '1 day', 1,
    'Automatic payment confirmation of $1,420.00 for annual infrastructure tier processed via Mastercard ending in 4242. No action required.',
    CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO emails (
    id, workspace_id, thread_id, account_id, external_message_id,
    sender_name, sender_email, sender_avatar, recipient_name, recipient_email,
    subject, snippet, body_text, sent_at, created_at, updated_at
) VALUES (
    'e0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'msg-003@stripe.com',
    'Stripe Billing', 'notifications@stripe.com', 'SB', 'Alex Rivera', 'billing@jiosi.online',
    'Invoice #INV-2024-8924 paid ($1,420.00)',
    'Your subscription for JIOSI Team Tier renewed successfully. Next billing cycle begins December 1, 2026...',
    'Hello JIOSI Team,

This is a receipt for your recent payment of $1,420.00 for the JIOSI Infrastructure & Compute tier.

Summary:
- Plan: Team Enterprise Scale (Annual)
- Transaction ID: ch_3P7eK2LmNO987
- Date: Nov 2, 2026
- Payment method: Mastercard ending in 4242

You can download your PDF tax invoice directly from your customer portal.

Thank you for your business!
The Stripe Team',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO thread_tags (thread_id, tag) VALUES
    ('d0000000-0000-0000-0000-000000000003', 'Finance'),
    ('d0000000-0000-0000-0000-000000000003', 'Receipts')
ON CONFLICT (thread_id, tag) DO NOTHING;

INSERT INTO email_attachments (id, email_id, filename, size_bytes, content_type) VALUES
    ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'Invoice_INV-2024-8924.pdf', 114688, 'application/pdf')
ON CONFLICT (id) DO NOTHING;

-- Thread 4: Elena Rostova (Lattice)
INSERT INTO email_threads (
    id, workspace_id, account_id, external_thread_id, subject, snippet,
    sender_name, sender_email, sender_avatar, sender_role, recipient_name, recipient_email,
    is_unread, is_starred, is_needs_reply, is_snoozed, is_archived, is_sent, is_draft,
    last_message_at, message_count, ai_summary, created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'ext-thread-004',
    'Sync on Q4 API partnerships & integration scope',
    'Following up on our call regarding the webhook latency SLAs and the enterprise OAuth handshake protocol...',
    'Elena Rostova', 'elena.rostova@lattice-sync.io', 'ER', 'VP Product, Lattice',
    'Alex Rivera', 'alex@jiosi.online',
    false, true, true, false, false, false, false,
    CURRENT_TIMESTAMP - INTERVAL '3 days', 1,
    'Elena confirmed Lattice approved the webhook security posture and requests the updated OpenAPI spec by Friday to start mock tests next sprint.',
    CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO emails (
    id, workspace_id, thread_id, account_id, external_message_id,
    sender_name, sender_email, sender_avatar, recipient_name, recipient_email,
    subject, snippet, body_text, sent_at, created_at, updated_at
) VALUES (
    'e0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'msg-004@lattice-sync.io',
    'Elena Rostova', 'elena.rostova@lattice-sync.io', 'ER', 'Alex Rivera', 'alex@jiosi.online',
    'Sync on Q4 API partnerships & integration scope',
    'Following up on our call regarding the webhook latency SLAs and the enterprise OAuth handshake protocol...',
    'Hi Alex,

Thanks for walking through the technical architecture on Monday. Our engineering leads reviewed the webhook payloads and everything looks compliant with our security posture.

Can your team provide the updated OpenAPI specification by Friday? We want to begin mock integration tests next sprint.

Best,
Elena',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO thread_tags (thread_id, tag) VALUES
    ('d0000000-0000-0000-0000-000000000004', 'Partnership'),
    ('d0000000-0000-0000-0000-000000000004', 'API')
ON CONFLICT (thread_id, tag) DO NOTHING;

INSERT INTO thread_action_items (id, thread_id, item_text, position) VALUES
    ('10000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000004', 'Export updated OpenAPI 3.1 specification for webhooks', 0),
    ('10000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004', 'Reply to Elena with endpoint documentation before Friday', 1)
ON CONFLICT (id) DO NOTHING;

-- Thread 5: Marcus Sterling (Hiring)
INSERT INTO email_threads (
    id, workspace_id, account_id, external_thread_id, subject, snippet,
    sender_name, sender_email, sender_avatar, sender_role, recipient_name, recipient_email,
    is_unread, is_starred, is_needs_reply, is_snoozed, is_archived, is_sent, is_draft,
    last_message_at, message_count, ai_summary, created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'ext-thread-005',
    'Candidate briefing: Principal Systems Engineer',
    'Reviewing candidate scorecards from round 3 interviews. Both candidates demonstrated strong concurrency and distributed systems depth...',
    'Marcus Sterling', 'marcus@sterlingtalent.co', 'MS', 'Executive Recruiter',
    'Alex Rivera', 'alex@jiosi.online',
    false, false, false, false, false, false, false,
    CURRENT_TIMESTAMP - INTERVAL '5 days', 1,
    'Marcus provided candidate scorecards for the Principal Systems Engineer position and asks whether to prepare an offer proposal for Candidate A.',
    CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO emails (
    id, workspace_id, thread_id, account_id, external_message_id,
    sender_name, sender_email, sender_avatar, recipient_name, recipient_email,
    subject, snippet, body_text, sent_at, created_at, updated_at
) VALUES (
    'e0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000002',
    'msg-005@sterlingtalent.co',
    'Marcus Sterling', 'marcus@sterlingtalent.co', 'MS', 'Alex Rivera', 'alex@jiosi.online',
    'Candidate briefing: Principal Systems Engineer',
    'Reviewing candidate scorecards from round 3 interviews. Both candidates demonstrated strong concurrency and distributed systems depth...',
    'Alex,

Attached are the debrief notes for the two final candidates for the Principal Systems Engineer opening. Both scored high on system design and low-level JVM profiling.

Let me know if you would like to proceed with the offer proposal for Candidate A this week.

Marcus',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '5 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO thread_tags (thread_id, tag) VALUES
    ('d0000000-0000-0000-0000-000000000005', 'Hiring')
ON CONFLICT (thread_id, tag) DO NOTHING;

-- Thread 6: Cloudflare Security (Snoozed)
INSERT INTO email_threads (
    id, workspace_id, account_id, external_thread_id, subject, snippet,
    sender_name, sender_email, sender_avatar, sender_role, recipient_name, recipient_email,
    is_unread, is_starred, is_needs_reply, is_snoozed, snoozed_until, is_archived, is_sent, is_draft,
    last_message_at, message_count, ai_summary, created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'ext-thread-006',
    'SSL Certificate Renewal for *.jiosi.online',
    'Edge certificate rotation scheduled in 14 days. No action required unless custom CAA records are configured...',
    'Cloudflare Security', 'alerts@cloudflare.com', 'CS', 'Security Alerts',
    'Alex Rivera', 'security@jiosi.online',
    false, false, false, true, CURRENT_TIMESTAMP + INTERVAL '1 day', false, false, false,
    CURRENT_TIMESTAMP - INTERVAL '6 days', 1,
    'Automated notice confirming edge SSL certificates will automatically renew without downtime.',
    CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO emails (
    id, workspace_id, thread_id, account_id, external_message_id,
    sender_name, sender_email, sender_avatar, recipient_name, recipient_email,
    subject, snippet, body_text, sent_at, created_at, updated_at
) VALUES (
    'e0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000002',
    'msg-006@cloudflare.com',
    'Cloudflare Security', 'alerts@cloudflare.com', 'CS', 'Alex Rivera', 'security@jiosi.online',
    'SSL Certificate Renewal for *.jiosi.online',
    'Edge certificate rotation scheduled in 14 days. No action required unless custom CAA records are configured...',
    'Automated Notice:

Your managed edge wildcard SSL certificate for *.jiosi.online will be renewed automatically in 14 days.

- Common Name: *.jiosi.online
- Issuer: Google Trust Services
- Status: Auto-renewal verified
- DNS Validation: Success

You snoozed this notification until tomorrow morning.',
    CURRENT_TIMESTAMP - INTERVAL '6 days',
    CURRENT_TIMESTAMP - INTERVAL '6 days',
    CURRENT_TIMESTAMP - INTERVAL '6 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO thread_tags (thread_id, tag) VALUES
    ('d0000000-0000-0000-0000-000000000006', 'DevOps'),
    ('d0000000-0000-0000-0000-000000000006', 'Security')
ON CONFLICT (thread_id, tag) DO NOTHING;

-- Thread 7: Priya Patel (Snoozed & Starred)
INSERT INTO email_threads (
    id, workspace_id, account_id, external_thread_id, subject, snippet,
    sender_name, sender_email, sender_avatar, sender_role, recipient_name, recipient_email,
    is_unread, is_starred, is_needs_reply, is_snoozed, snoozed_until, is_archived, is_sent, is_draft,
    last_message_at, message_count, ai_summary, created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'ext-thread-007',
    'Weekly Product Retention & Activation Cohorts (W44)',
    'Week-over-week D7 retention up 14% following the streamlined 3-panel onboarding flow. Deep dive inside...',
    'Priya Patel', 'priya@jiosi.online', 'PP', 'Growth Lead',
    'Alex Rivera', 'alex@jiosi.online',
    false, true, false, true, CURRENT_TIMESTAMP + INTERVAL '3 days', false, false, false,
    CURRENT_TIMESTAMP - INTERVAL '7 days', 1,
    'Weekly growth metrics showed a 14% jump in D7 retention and 38% adoption of ⌘K search.',
    CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO emails (
    id, workspace_id, thread_id, account_id, external_message_id,
    sender_name, sender_email, sender_avatar, recipient_name, recipient_email,
    subject, snippet, body_text, sent_at, created_at, updated_at
) VALUES (
    'e0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000002',
    'msg-007@jiosi.online',
    'Priya Patel', 'priya@jiosi.online', 'PP', 'Alex Rivera', 'alex@jiosi.online',
    'Weekly Product Retention & Activation Cohorts (W44)',
    'Week-over-week D7 retention up 14% following the streamlined 3-panel onboarding flow. Deep dive inside...',
    'Hey Alex,

Summary of this week''s retention cohort analysis:
- D1 retention: 64% (up from 52%)
- D7 retention: 41% (up from 27%)
- Keyboard shortcuts adoption: 38% of active daily users use ⌘K at least 5 times per session.

I have snoozed this thread until our Friday sprint retrospective so we can discuss expanding the AI summarizer rollout.

Priya',
    CURRENT_TIMESTAMP - INTERVAL '7 days',
    CURRENT_TIMESTAMP - INTERVAL '7 days',
    CURRENT_TIMESTAMP - INTERVAL '7 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO thread_tags (thread_id, tag) VALUES
    ('d0000000-0000-0000-0000-000000000007', 'Analytics'),
    ('d0000000-0000-0000-0000-000000000007', 'Growth')
ON CONFLICT (thread_id, tag) DO NOTHING;

-- Thread 8: Alex Rivera (Sent reply to Sarah Jenkins)
INSERT INTO email_threads (
    id, workspace_id, account_id, external_thread_id, subject, snippet,
    sender_name, sender_email, sender_avatar, sender_role, recipient_name, recipient_email,
    is_unread, is_starred, is_needs_reply, is_snoozed, is_archived, is_sent, is_draft,
    last_message_at, message_count, ai_summary, created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'ext-thread-008',
    'Re: Q3 Seed Extension Term Sheet & Cap Table updates',
    'Sarah, thank you for the fast turnaround. Our legal team reviewed the pro-rata amendments and we are aligned...',
    'Alex Rivera', 'alex@jiosi.online', 'AR', 'Founder',
    'Sarah Jenkins', 'sarah@kinto.ventures',
    false, false, false, false, false, true, false,
    CURRENT_TIMESTAMP - INTERVAL '1 day', 1,
    'Sent reply confirming Thursday 2:00 PM PT closing call with Kinto Ventures.',
    CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO emails (
    id, workspace_id, thread_id, account_id, external_message_id,
    sender_name, sender_email, sender_avatar, recipient_name, recipient_email,
    subject, snippet, body_text, sent_at, created_at, updated_at
) VALUES (
    'e0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000002',
    'msg-008@jiosi.online',
    'Alex Rivera', 'alex@jiosi.online', 'AR', 'Sarah Jenkins', 'sarah@kinto.ventures',
    'Re: Q3 Seed Extension Term Sheet & Cap Table updates',
    'Sarah, thank you for the fast turnaround. Our legal team reviewed the pro-rata amendments and we are aligned...',
    'Hi Sarah,

Thank you for the quick turnaround on the term sheet adjustments.

Our legal counsel had a preliminary look this morning and everything is in order with the $18M cap and pro-rata allocations. We are booking Thursday at 2:00 PM PT on the calendar for the closing review.

Looking forward to partnering with Kinto on this next phase!

Best,
Alex',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO thread_tags (thread_id, tag) VALUES
    ('d0000000-0000-0000-0000-000000000008', 'Fundraising')
ON CONFLICT (thread_id, tag) DO NOTHING;

-- Thread 9: Alex Rivera (Sent paper to Dr. Hayes)
INSERT INTO email_threads (
    id, workspace_id, account_id, external_thread_id, subject, snippet,
    sender_name, sender_email, sender_avatar, sender_role, recipient_name, recipient_email,
    is_unread, is_starred, is_needs_reply, is_snoozed, is_archived, is_sent, is_draft,
    last_message_at, message_count, ai_summary, created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'ext-thread-009',
    'JIOSI AI Whitepaper v1.4 Final Copy',
    'Alan, attached is the revised technical paper covering our hybrid vector indexing and privacy-first local caching...',
    'Alex Rivera', 'alex@jiosi.online', 'AR', 'Founder',
    'Dr. Alan Hayes', 'alan.hayes@deeptech-research.org',
    false, false, false, false, false, true, false,
    CURRENT_TIMESTAMP - INTERVAL '4 days', 1,
    'Sent research paper draft on zero-retention email processing to Dr. Alan Hayes.',
    CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO emails (
    id, workspace_id, thread_id, account_id, external_message_id,
    sender_name, sender_email, sender_avatar, recipient_name, recipient_email,
    subject, snippet, body_text, sent_at, created_at, updated_at
) VALUES (
    'e0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000002',
    'msg-009@jiosi.online',
    'Alex Rivera', 'alex@jiosi.online', 'AR', 'Dr. Alan Hayes', 'alan.hayes@deeptech-research.org',
    'JIOSI AI Whitepaper v1.4 Final Copy',
    'Alan, attached is the revised technical paper covering our hybrid vector indexing and privacy-first local caching...',
    'Dr. Hayes,

Attached is the updated copy of our technical architecture whitepaper (v1.4) incorporating your suggestions on verifiable zero-retention data pipelines.

Please let me know if you have any additional citations to include before we publish on arXiv next Tuesday.

Best,
Alex Rivera',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO thread_tags (thread_id, tag) VALUES
    ('d0000000-0000-0000-0000-000000000009', 'Research')
ON CONFLICT (thread_id, tag) DO NOTHING;

INSERT INTO email_attachments (id, email_id, filename, size_bytes, content_type) VALUES
    ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000009', 'JIOSI_Architecture_Paper_v1.4.pdf', 3984588, 'application/pdf')
ON CONFLICT (id) DO NOTHING;

-- Thread 10: Alex Rivera (Draft to Google Cloud Partnerships)
INSERT INTO email_threads (
    id, workspace_id, account_id, external_thread_id, subject, snippet,
    sender_name, sender_email, sender_avatar, sender_role, recipient_name, recipient_email,
    is_unread, is_starred, is_needs_reply, is_snoozed, is_archived, is_sent, is_draft,
    last_message_at, message_count, ai_summary, created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'ext-thread-010',
    'Exploring Gemini 2.0 Integration for JIOSI Inbox Enterprise',
    'Draft message regarding enterprise tier latency benchmarks and private VPC deployment options...',
    'Alex Rivera', 'alex@jiosi.online', 'AR', 'Founder',
    'Google Cloud Partnerships', 'partnerships@google.com',
    false, false, false, false, false, false, true,
    CURRENT_TIMESTAMP - INTERVAL '15 minutes', 1,
    'Draft email to Google Cloud Partnerships regarding Gemini enterprise integration.',
    CURRENT_TIMESTAMP - INTERVAL '15 minutes', CURRENT_TIMESTAMP - INTERVAL '15 minutes'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO emails (
    id, workspace_id, thread_id, account_id, external_message_id,
    sender_name, sender_email, sender_avatar, recipient_name, recipient_email,
    subject, snippet, body_text, sent_at, created_at, updated_at
) VALUES (
    'e0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000002',
    'draft-010@jiosi.online',
    'Alex Rivera', 'alex@jiosi.online', 'AR', 'Google Cloud Partnerships', 'partnerships@google.com',
    'Exploring Gemini 2.0 Integration for JIOSI Inbox Enterprise',
    'Draft message regarding enterprise tier latency benchmarks and private VPC deployment options...',
    'Hi Google Cloud Team,

We are developing JIOSI Inbox, an intelligent productivity platform, and are exploring integration with the Gemini 2.0 API for low-latency thread summarization and context retrieval.

We would love to discuss enterprise pricing tiers and private cloud deployment models for high-compliance enterprise customers.

Best,
Alex Rivera
Founder & CEO, JIOSI AI',
    CURRENT_TIMESTAMP - INTERVAL '15 minutes',
    CURRENT_TIMESTAMP - INTERVAL '15 minutes',
    CURRENT_TIMESTAMP - INTERVAL '15 minutes'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO thread_tags (thread_id, tag) VALUES
    ('d0000000-0000-0000-0000-000000000010', 'Draft'),
    ('d0000000-0000-0000-0000-000000000010', 'Partnership')
ON CONFLICT (thread_id, tag) DO NOTHING;

-- Persistent Draft table record
INSERT INTO email_drafts (
    id, workspace_id, thread_id, to_email, recipient_name, subject, body, created_at, updated_at
) VALUES (
    'b1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000010',
    'partnerships@google.com',
    'Google Cloud Partnerships',
    'Exploring Gemini 2.0 Integration for JIOSI Inbox Enterprise',
    'Hi Google Cloud Team,

We are developing JIOSI Inbox, an intelligent productivity platform, and are exploring integration with the Gemini 2.0 API for low-latency thread summarization and context retrieval.

We would love to discuss enterprise pricing tiers and private cloud deployment models for high-compliance enterprise customers.

Best,
Alex Rivera
Founder & CEO, JIOSI AI',
    CURRENT_TIMESTAMP - INTERVAL '15 minutes',
    CURRENT_TIMESTAMP - INTERVAL '15 minutes'
) ON CONFLICT (id) DO NOTHING;
