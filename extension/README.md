# JIOSI Inbox — Chrome Side Panel Companion

The JIOSI Action Assistant is a Manifest V3 Chrome Extension side panel designed for desktop Gmail users. It turns Gmail into a focused email action assistant for small businesses.

---

## 1. Capabilities

1. **Current Thread Action Assistant:**
   - Detects the active Gmail email thread without scraping internal Gmail DOM elements.
   - Computes separate, explainable **Importance** (0–100) and **Urgency** (0–100) scores.
   - Identifies **Who Owes the Next Step** (`User owes response` vs `Waiting on counterpart`).
   - Surfaces **AI Key Takeaways** (gist, key decisions, open question, explicit deadline, suggested next action).
   - Extracts and tracks **Commitments & Promises** with exact evidence quotes from source email text.
   - Generates contextual, reviewable **Reply Drafts** with tone (`Professional`, `Friendly`, `Concise`) and language (`Original`, `English`, `Hindi`) controls.
   - Provides safe **Triage Corrections** ("Not Spam", "Mark Suspicious", "Important") saved strictly in JIOSI's database.

2. **Personalized Daily Business Email Brief:**
   - **Needs you today:** Urgent items, explicit deadlines today, or high-impact requests.
   - **Waiting on someone else:** Tasks or responses pending from counterparts.
   - **Promises you made:** Open obligations promised by the authenticated user.
   - **Important, but not urgent:** High-value correspondence without immediate time pressure.
   - **Newsletters / bulk:** Low-priority newsletters and updates.
   - **Possible spam / suspicious:** Conservative review candidates.

3. **Small Business Workflow Profiles:**
   - Generic Small Business (default, zero setup needed)
   - Freelancer / Agency
   - Local Service / Trades
   - Retail / E-commerce
   - Professional Services
   - Small Software / SaaS

---

## 2. Security & Privacy Architecture

- **Zero API Keys in Extension:** The extension contains **zero** Groq API keys, OpenAI keys, or Gmail OAuth tokens.
- **Backend-Only AI Calls:** All Groq AI completions and triage scoring run server-side through Spring Boot.
- **No DOM Scraping:** The extension extracts the Gmail thread ID from the URL hash and retrieves authorized data via JIOSI's authenticated REST API.
- **Production API by Default:** Default backend is `https://jiosi-inbox-api.onrender.com`. Localhost `http://localhost:8080` is supported only for local testing.
- **Strict Backend URL Validation:**
  - Embedded credentials (`https://user:pass@host`) are explicitly rejected.
  - HTTPS is strictly required for all remote production hosts. HTTP is permitted exclusively on `localhost` and `127.0.0.1`.
  - Unsafe schemes (`javascript:`, `file:`, `data:`, `ftp:`) are blocked.
- **Secure Authentication Flow:**
  - Tokens are **never** stored in plaintext in persistent disk storage (`chrome.storage.local`).
  - Session tokens are stored strictly in-memory during the active browser session (`chrome.storage.session`).
  - Cross-origin requests transmit the session token securely via `Authorization: Bearer <token>`, avoiding third-party cookie blocking and cross-origin SameSite restrictions.
- **CORS Configuration & Extension Origin:**
  - Wildcard CORS origins (`*`) with credentials are intentionally forbidden for security.
  - Production backend restricts CORS to exact configured origins: `https://inbox.jiosi.online`, `http://localhost:5173`, and exact 32-character Chrome extension IDs matching `^[a-p]{32}$`.
  - In deployment environments (Render), configure `CORS_ALLOWED_EXTENSION_IDS=<32-char-extension-id>` once the extension is registered in the Chrome Web Store or assigned a permanent key.
- **Narrow Permissions:**
  - `sidePanel`: Needed to open the assistant seamlessly alongside Gmail in the browser.
  - `storage`: Needed to remember the selected workspace ID, backend API URL, and profile preference.
  - `activeTab`: Needed to read the current Gmail URL when the user opens the side panel.
  - `host_permissions`: Strictly restricted to `https://mail.google.com/*` and JIOSI backend endpoints (`https://jiosi-inbox-api.onrender.com/*`, `http://localhost:8080/*`).
- **OAuth Scope Integrity:** Uses JIOSI's existing `gmail.readonly` scope. It does not broaden OAuth scopes or perform unauthorized label mutations on Google's servers.

---

## 3. Installation (Developer Mode)

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click **Load unpacked** in the top-left toolbar.
4. Select the `extension/` folder in this repository.
5. Navigate to [Gmail Desktop](https://mail.google.com).
6. Click the JIOSI extension icon in your Chrome toolbar or side panel button to open the companion.

---

## 4. Mobile Note

Manifest V3 Side Panels are designed for desktop Chrome browsers. For future mobile Gmail workflow support, a Google Workspace Add-on (Apps Script / Cloud Run) is identified as the viable roadmap path.

