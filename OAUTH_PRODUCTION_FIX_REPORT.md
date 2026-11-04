# JIOSI Inbox — Google OAuth Production Redirect URI Fix Report

**Date:** November 4, 2026<br/>
**Repository:** `shivam-shukla888/inbox.jiosi.online`<br/>
**Active Working Branch:** `fix/production-google-oauth`<br/>
**Base Commit:** `f03d767` (`origin/main`)<br/>
**Current Pull Request:** PR #2 (`https://github.com/shivam-shukla888/inbox.jiosi.online/pull/2`)<br/>
**Production URLs:**
- Frontend: `https://inbox.jiosi.online` (Vercel)
- Backend: `https://jiosi-inbox-api.onrender.com` (Render, Spring Boot 3.3.5 / Java 21)
- Neon PostgreSQL: Connected and healthy

---

## 1. Executive Summary & Problem Diagnosis

### The Observed Production Symptoms
1. **Google Error 400: `redirect_uri_mismatch`:**
   When users clicked "Sign in with Google", Google rejected the request with `Error 400: redirect_uri_mismatch` whenever the backend dynamically computed `{baseUrl}` as `https://jiosi-inbox-api.onrender.com/login/oauth2/code/google` while the initiated session lived on `inbox.jiosi.online`.
2. **"Authentication Failed" Failure Loop:**
   Even when `https://jiosi-inbox-api.onrender.com/login/oauth2/code/google` was added to Google Cloud Console's authorized redirect URIs, the OAuth flow completed at Google and returned the browser to `https://jiosi-inbox-api.onrender.com/login/oauth2/code/google?code=...&state=...`.
   Render received the callback, but the user's browser **did not send the `JSESSIONID` cookie** (because the cookie was set on domain `inbox.jiosi.online`, not `onrender.com`).
   Spring Security's `OAuth2AuthorizationRequestRedirectFilter` / `HttpSessionOAuth2AuthorizationRequestRepository` failed to locate the authorization request from session, throwing `[authorization_request_not_found]`.
   The `OAuth2AuthenticationFailureHandler` caught the exception and redirected back to `https://inbox.jiosi.online/?auth_error=OAuth2+authentication+failed`, displaying **"Authentication Failed"** on the UI.

---

## 2. Empirical Proof & Root Cause Analysis

### Live Network Trace (Verified via curl)
```bash
curl -I -s "https://inbox.jiosi.online/oauth2/authorization/google"
# Returned:
# HTTP/2 302
# set-cookie: JSESSIONID=7B8F9A0837D92631525A4B7A09230154; Path=/; Secure; HttpOnly; SameSite=Lax
# location: https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=...&scope=openid%20profile%20email&state=...&redirect_uri=https://jiosi-inbox-api.onrender.com/login/oauth2/code/google
```

### Key Architectural Invariant Identified
1. **First-Party Cookie Isolation:**
   When a user visits `https://inbox.jiosi.online` and initiates OAuth, the browser receives `Set-Cookie: JSESSIONID=...` bound to `inbox.jiosi.online`.
2. **Vercel Reverse Proxy:**
   `frontend/vercel.json` already proxies `/login/oauth2/:path*` to `https://jiosi-inbox-api.onrender.com/login/oauth2/:path*`.
   However, because Vercel's edge proxy strips or transforms `X-Forwarded-Host`, Spring Security's `{baseUrl}` placeholder expanded to `https://jiosi-inbox-api.onrender.com` rather than `https://inbox.jiosi.online`.
3. **Cross-Domain Session Drop:**
   If Google redirects to `https://jiosi-inbox-api.onrender.com`, the browser treats `onrender.com` as a third-party domain and strips the `inbox.jiosi.online` `JSESSIONID`. Spring Boot on Render sees an empty session and aborts the login.
4. **The Required Invariant:**
   The OAuth redirect URI **MUST** be:
   ```text
   https://inbox.jiosi.online/login/oauth2/code/google
   ```
   When Google redirects the browser to `https://inbox.jiosi.online/login/oauth2/code/google`, the browser attaches the existing first-party `JSESSIONID` cookie. Vercel forwards the request and cookie header to Render. Spring Security retrieves the session, verifies `state`, exchanges the authorization code for tokens, and successfully logs the user in!

---

## 3. PR #2 Review Findings & Security Hardening

Following PR #2 review, four critical areas were hardened:

### Priority 1: Server-Side Authorization for Gmail Linking
- **Removed Browser-Supplied Parameter Trust:** `CustomOAuth2AuthorizationRequestResolver` no longer parses or trusts `user_id` or `workspace_id` from request query parameters.
- **Server-Side Principal Binding:** In `GmailController.getConnectUrl`, the user is authenticated via JWT/SecurityContext. The user ID and workspace ID are bound strictly to the server-side `HttpSession`.
- **Pre-Persist Workspace Authorization:** In `OAuth2AuthenticationSuccessHandler`, before storing any tokens or connected account, `workspaceAuthorizationService.validateAccess(wsId, targetUser)` verifies that the authenticated principal is an authorized member or owner of the workspace. If access is denied, tokens are discarded and the request redirects with `auth_error=Access+denied+to+workspace`.

### Priority 2: Structural Redirect URI & Origin Validation
- **Replaced `startsWith` Matching:** Replaced prefix checks with strict URI parsing and exact scheme, host, and effective-port comparison.
- **Startup Validation:** Validates `frontendUrl` at startup: requires `http` or `https`, non-empty host, rejects userinfo credentials, queries, and fragments.
- **Lookalike Host & Alternate Port Defense:** Requests with lookalike hosts (e.g. `inbox.jiosi.online.attacker.example`) or alternate ports (e.g. `:8443`) are detected as origin mismatches and aligned safely to `https://inbox.jiosi.online/login/oauth2/code/google`.

### Priority 3: Configuration Binding & Session Continuity Tests
- **Spring Configuration Binding Tests:** Added `OAuth2ProductionConfigBindingTests` verifying `application-prod.yml` binds the production redirect URI default (`https://inbox.jiosi.online/login/oauth2/code/{registrationId}`) and respects `GOOGLE_REDIRECT_URI` environment variable overrides using Spring Boot's `YamlPropertySourceLoader` and `Binder`.
- **Session State Continuity Integration Test:** Verified that OAuth initiation sets session state, and the subsequent callback with the same session successfully retrieves authorization state, contrasting with a lost-session callback that fails closed.
- **Reverse Proxy Disclaimer:** Automated servlet tests verify server-side Spring Security session handling; reverse-proxy cookie forwarding by Vercel must be independently validated on deployed preview environments.

---

## 4. Verification & Test Results

### Backend Automated Test Suite
- Total tests executed: **100**
- Failures: **0**
- Errors: **0**
- Skipped: **0**
- Status: **BUILD SUCCESS**

### Frontend Automated Test Suite
- `npm run typecheck`: **0 errors** (TypeScript cleanly verified).
- `npm test -- --run`: **46/46 passed** (Vitest).

---

## 5. Dashboard Configuration Checklist

### A. Google Cloud Console (APIs & Services > Credentials > OAuth 2.0 Client IDs)
Under `Authorized redirect URIs`:
- [x] `http://localhost:8080/login/oauth2/code/google` (for local development)
- [x] `https://inbox.jiosi.online/login/oauth2/code/google` (**PRIMARY PRODUCTION CALLBACK**)
- [x] `https://jiosi-inbox-api.onrender.com/login/oauth2/code/google` (secondary/direct backup)

Under `Authorized JavaScript origins`:
- [x] `http://localhost:5173`
- [x] `http://localhost:8080`
- [x] `https://inbox.jiosi.online`

### B. Render Environment Variables (`jiosi-inbox-api`)
- `SPRING_PROFILES_ACTIVE`: `prod`
- `FRONTEND_URL`: `https://inbox.jiosi.online`
- `GOOGLE_CLIENT_ID`: `<your-google-client-id>.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET`: `<your-google-client-secret>`
- `GOOGLE_REDIRECT_URI`: `https://inbox.jiosi.online/login/oauth2/code/google` *(Optional, as this is now the default in `application-prod.yml`)*

### C. Vercel Environment Variables (`frontend`)
- `VITE_API_BASE_URL`: Left empty or set to `/api/v1` (letting Vercel proxy handle requests via `vercel.json`).

---

## 6. PR #2 Status & Gate
- Initial commit `fb97d210d95cf7096c30485313ec14ff526d3ed0` published to PR #2.
- Hardening changes addressing review findings (Priorities 1-4) are staged locally on branch `fix/production-google-oauth`.
- No merges into `main` or production deployments have been executed.
- Awaiting user review and approval before pushing updates to PR #2.
