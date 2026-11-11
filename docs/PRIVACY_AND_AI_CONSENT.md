# JIOSI Inbox — Email Privacy, AI Consent & Companion Security

## 1. Overview & Privacy Principles

JIOSI Inbox is built on strict privacy-first engineering:
1. **Advisory-Only Action**: JIOSI Inbox never executes unconfirmed destructive actions (no auto-reply, no auto-archive, no label deletions, no calendar writes).
2. **Explicit User Consent**: Inbound message text is never processed by external AI providers unless the user has explicitly consented to AI processing.
3. **Zero Model Training**: Customer email text is never used to train, retrain, or fine-tune public, open-source, or third-party foundational language models.
4. **Tenant Isolation**: All emails, threads, triage records, commitments, and daily brief caches are isolated by `workspace_id` in PostgreSQL with strict foreign keys and server-side interceptors.
5. **No Credential Exposure**: OAuth refresh tokens are encrypted at rest with AES-256-GCM. Plaintext mailbox credentials, passwords, and API keys are never stored in browser storage or transmitted to AI inference providers.

---

## 2. Groq AI Integration & Data Flow

### What Data Is Sent to Groq?
When an authorized user with active AI consent requests an AI-assisted feature, the backend extracts only the necessary contextual information from the selected thread:
- **Email Subject**
- **Sender & Recipient Display Names / Email Addresses**
- **Email Body Text** (truncated to `jiosi.ai.groq.max-input-chars`, default 12,000 characters)

The data is wrapped inside strict anti-injection boundary tags (`<<<EMAIL_DATA_START>>> ... <<<EMAIL_DATA_END>>>`) and transmitted over TLS to Groq's inference endpoint (`https://api.groq.com/openai/v1/chat/completions`).

**What Is NEVER Sent to Groq:**
- User passwords or session JWTs
- Google OAuth refresh tokens or access tokens
- Database IDs or internal session details
- Financial payment info or credit card credentials

### Features Governed by AI Consent:
1. **Thread Summarization**: Produces a concise gist, confirmed decisions, and open questions using `llama-3.3-70b-versatile`.
2. **Action Item & Commitment Extraction**: Identifies explicit deliverables and promises using `llama-3.3-70b-versatile`. All extracted commitments require verbatim evidence quote verification against the source email body.
3. **Triage & Classification**: Categorizes email (Primary, Newsletter, Promotional, Transactional, Suspicious, Spam) and scores urgency and importance.
4. **Contextual Reply Drafting**: Generates reviewable drafts across professional, friendly, or concise tones in English or Hindi using `llama-3.1-8b-instant`.
5. **Daily Business Brief**: Aggregates prioritized action items into 6 primary sections.
6. **Chrome Side Panel Companion**: Renders the above intelligence inside desktop Gmail.

### How Consent Is Controlled:
- Users can toggle consent on or off at any time in **Settings > Privacy & Security > AI Processing Consent**.
- Consent is persisted in the `user_ai_preferences` database table (`ai_processing_consent = true/false`).
- In the backend service layer (`EmailIntelligenceService` and `CommitmentService`), every AI request calls `assertUserConsent(user)`.
- If consent is off, the backend immediately throws `AiConsentRequiredException`, returning an HTTP 400 error (`AI_CONSENT_REQUIRED`) before any HTTP request leaves the server. **Zero bytes of email content reach Groq.**

---

## 3. Chrome Side Panel Companion Security

The Chrome Side Panel Companion (`extension/`) operates as a companion inside desktop Gmail.

### Key Security Safeguards:
1. **Zero DOM Scraping**: The extension never injects scripts into Gmail's DOM or scrapes email content from the page. It reads solely the Gmail thread ID from the window hash (`#inbox/:threadId`) and queries the authorized JIOSI backend API.
2. **No Plaintext Token Storage on Disk**:
   - Authentication tokens are **never** stored in `chrome.storage.local` (which persists in unencrypted SQLite/LevelDB files on disk).
   - Session tokens are stored strictly in `chrome.storage.session` (in-memory for the current browser session only, destroyed when Chrome closes).
   - The extension passes the token via `Authorization: Bearer <token>` on all API requests.
3. **Strict Backend URL Validation**:
   - Default backend is the production API (`https://jiosi-inbox-api.onrender.com`).
   - URLs with embedded credentials (`user:pass@host`) are rejected.
   - HTTPS is strictly required for production hosts; HTTP is permitted only for `localhost` and `127.0.0.1`.
   - Unsafe schemes (`javascript:`, `data:`, `file:`, `ftp:`) are blocked.
4. **Production CORS Configuration**:
   - Wildcard CORS origins (`*`) with credentials are completely forbidden.
   - In production, set the environment variable:
     ```bash
     CORS_ALLOWED_EXTENSION_IDS=<32-character-chrome-extension-id>
     ```
   - The backend validates the 32-character ID against `^[a-p]{32}$` and permits only the exact origin `chrome-extension://<id>`.

