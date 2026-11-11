# JIOSI Inbox — Email Privacy, AI Consent & Companion Security

## 1. Overview & Privacy Principles

JIOSI Inbox is built on strict privacy-first engineering:
1. **Advisory-Only Action**: JIOSI Inbox never executes unconfirmed destructive actions (no auto-reply, no auto-archive, no label deletions, no calendar writes).
2. **Explicit Opt-In by Default**: Inbound message text is never processed by external AI providers unless the user has explicitly opted into AI processing in Settings. Consent defaults strictly to `false` for all newly registered accounts and unconfigured profiles.
3. **Fail-Closed Architecture**: If consent status cannot be verified (missing preferences, unavailable repository, or database errors), all AI calls fail closed immediately with zero network egress to Groq.
4. **Zero Model Training**: Customer email text is never used to train, retrain, or fine-tune public, open-source, or third-party foundational language models.
5. **Tenant Isolation**: All emails, threads, triage records, commitments, and daily brief caches are isolated by `workspace_id` in PostgreSQL with strict foreign keys and server-side interceptors.
6. **No Credential Exposure**: OAuth refresh tokens are encrypted at rest with AES-256-GCM. Plaintext mailbox credentials, passwords, and API keys are never stored in browser storage or transmitted to AI inference providers.

---

## 2. Groq AI Integration & Data Flow

### What Data Is Sent to Groq?
When an authorized user with active explicit AI consent requests an AI-assisted feature, the backend extracts only the necessary contextual information from the selected thread:
- **Email Subject**
- **Sender & Recipient Display Names / Email Addresses**
- **Email Body Text** (truncated to `jiosi.ai.groq.max-input-chars`, default 12,000 characters)

The data is wrapped inside strict anti-injection boundary tags (`<<<EMAIL_DATA_START>>> ... <<<EMAIL_DATA_END>>>`) and transmitted over TLS to Groq's inference endpoint (`https://api.groq.com/openai/v1/chat/completions`).

**What Is NEVER Sent to Groq:**
- User passwords or session JWTs
- Google OAuth refresh tokens or access tokens
- Database IDs or internal session details
- Financial payment info or credit card credentials

### Features Governed by Explicit AI Consent:
1. **Thread Summarization**: Produces a concise gist, confirmed decisions, and open questions using `llama-3.3-70b-versatile`.
2. **Action Item & Commitment Extraction**: Identifies explicit deliverables and promises using `llama-3.3-70b-versatile`. All extracted commitments require verbatim evidence quote verification against the source email body.
3. **Triage & Classification**: Categorizes email (Primary, Newsletter, Promotional, Transactional, Suspicious, Spam) and scores urgency and importance.
4. **Contextual Reply Drafting**: Generates reviewable drafts across professional, friendly, or concise tones in English or Hindi using `llama-3.1-8b-instant`.
5. **Compose Assistance**: Rewrites, shortens, adjusts tone, fixes grammar, or translates text via `llama-3.1-8b-instant`.
6. **Chrome Side Panel Companion**: Renders the above intelligence inside desktop Gmail.

### Daily Business Brief Local Execution:
- The **Daily Business Brief** (`/api/v1/ai/daily-brief`) aggregates prioritized obligations, waiting items, and thread categories using local PostgreSQL database queries and deterministic local heuristics (`ScoringEngine`).
- It does **not** call Groq AI in the background, eliminating unexpected AI API token consumption and ensuring complete data privacy by default.

### How Consent Is Controlled & Enforced:
- **Explicit Opt-In Default**: The default value of `ai_processing_consent` in `user_ai_preferences` is `false`. New users have AI features paused by default.
- **Fail-Closed Validation**: In `EmailIntelligenceService.assertUserConsent(user)` and `CommitmentService.assertUserConsent(user)`:
  - If preference record is missing: consent is evaluated as `false`.
  - If `preferencesRepository` is null or throws an error: the check fails closed (`false`).
  - If `ai_processing_consent == false`: an `AiConsentRequiredException` is thrown immediately.
- **HTTP 400 Bad Request**: When consent is absent or false, the API returns:
  ```json
  {
    "success": false,
    "message": "AI processing is disabled in your privacy settings. Enable it in Settings > Privacy to use AI features.",
    "code": "AI_CONSENT_REQUIRED"
  }
  ```
  Zero HTTP calls are made to Groq.
- **Instant Revocation**: If a user unchecks the AI toggle in *Settings > Privacy & Security*, subsequent AI requests are blocked immediately with zero latency.

---

## 3. Database Migration & Historical User Handling

Flyway migration `V7__ai_consent_explicit_opt_in.sql` enforces strict opt-in across the database layer:
1. Sets the PostgreSQL table default for `ai_processing_consent` to `false`.
2. Resets historical preference records to `ai_processing_consent = false` so that no user is implicitly enrolled without their explicit confirmation.

### User-Visible Impact:
- Users who have not yet explicitly enabled AI in Settings will see a helpful guidance prompt (`AI_CONSENT_REQUIRED`) when triggering an AI feature.
- A one-click toggle in **Settings > Privacy & Security** allows users to review Groq's data policy and explicitly activate AI intelligence processing.

---

## 4. Chrome Side Panel Companion Security

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
