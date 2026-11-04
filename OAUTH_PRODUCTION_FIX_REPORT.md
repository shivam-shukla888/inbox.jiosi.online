# JIOSI Inbox — Google OAuth Production Redirect URI Fix Report

**Date:** November 4, 2026<br/>
**Repository:** `shivam-shukla888/inbox.jiosi.online`<br/>
**Active Working Branch:** `fix/production-google-oauth`<br/>
**Base Commit:** `f03d767` (`origin/main`)<br/>
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

## 3. Code & Configuration Fixes

### 1. `backend/src/main/resources/application-prod.yml`
Configured the Google OAuth redirect-uri in production to default to the frontend domain while allowing environment override:
```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            redirect-uri: "${GOOGLE_REDIRECT_URI:https://inbox.jiosi.online/login/oauth2/code/{registrationId}}"
```

### 2. `backend/src/main/resources/application.yml`
Added `GOOGLE_REDIRECT_URI` environment variable support and `app.backend-url`:
```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            redirect-uri: "${GOOGLE_REDIRECT_URI:{baseUrl}/login/oauth2/code/{registrationId}}"

app:
  backend-url: ${BACKEND_URL:${SERVER_URL:http://localhost:8080}}
```

### 3. `CustomOAuth2AuthorizationRequestResolver.java`
Added intelligent reverse-proxy alignment:
- Injects `frontendUrl`.
- If `frontendUrl` is a public HTTPS domain (`https://inbox.jiosi.online`) and the internally computed redirect URI points to a backend domain (e.g., `jiosi-inbox-api.onrender.com`), it rewrites the redirect URI to `${cleanFrontend} + uri.getRawPath()`.
- If running in local dev (`http://localhost:5173` or `http://localhost:8080`), it preserves standard localhost redirect URI generation without mutation.

### 4. `SecurityConfig.java`
- Injected `@Value("${app.frontend-url:http://localhost:5173}") String frontendUrl` and passed it to `new CustomOAuth2AuthorizationRequestResolver(repo, frontendUrl)`.

### 5. `GmailController.java`
- Injected `frontendUrl`.
- In production HTTPS, derives `authBaseUrl` from `frontendUrl` (`https://inbox.jiosi.online`), ensuring incremental OAuth authorization (`/oauth2/authorization/google?action=connect_gmail`) uses the frontend domain rather than falling back to `http://localhost:8080`.

### 6. `frontend/src/api/client.ts`
- In `getGoogleOAuthUrl()`, added an explicit check:
```typescript
getGoogleOAuthUrl(): string {
  if (import.meta.env.PROD) {
    return '/oauth2/authorization/google';
  }
  return `${this.baseUrl}/oauth2/authorization/google`;
}
```
Ensures the client always routes OAuth initiation through the frontend domain (`https://inbox.jiosi.online/oauth2/authorization/google`), even if `VITE_API_BASE_URL` is set to Render in Vercel.

---

## 4. Verification & Test Results

### Backend Automated Test Suite
- Total tests executed: **92**
- Failures: **0**
- Errors: **0**
- Skipped: **0**
- Status: **BUILD SUCCESS**
- Included new comprehensive test suite in `OAuth2RedirectUriTests.java`:
  1. `testLocalDevRedirectUri_Preserved`: Verifies `localhost:8080` redirect URI is preserved in local dev.
  2. `testProductionRedirectUri_AlignedToFrontendDomain`: Verifies onrender.com backend host is dynamically aligned to `https://inbox.jiosi.online/login/oauth2/code/google`.
  3. `testProductionClientRegistrationTemplate_MatchesInboxDomain`: Verifies registration template matches `inbox.jiosi.online`.
  4. `testGmailConnectIncrementalAuth_RetainsAlignedRedirectUri`: Verifies incremental OAuth requests include `gmail.readonly` and retain the aligned redirect URI.
  5. `testGmailController_GeneratesFrontendConnectUrlInProduction`: Verifies Gmail connect URL starts with `https://inbox.jiosi.online`.
  6. `testGmailController_GeneratesLocalhostConnectUrlInDev`: Verifies localhost dev fallback.
  7. `testFailureHandler_RedirectsToFrontendUrl`: Verifies safe failure redirect encoding.

### Frontend Automated Test Suite
- `npm run typecheck`: **0 errors** (TypeScript cleanly verified).
- `npm test -- --run`: **46/46 passed** (Vitest).
- `npm run build`: **Success** (`dist/` built in 7.14s).

---

## 5. Dashboard Configuration Checklist

### A. Google Cloud Console (APIs & Services > Credentials > OAuth 2.0 Client IDs)
Under `Authorized redirect URIs`, ensure the following entries are present:
- [x] `http://localhost:8080/login/oauth2/code/google` (for local development)
- [x] `https://inbox.jiosi.online/login/oauth2/code/google` (**PRIMARY PRODUCTION CALLBACK**)
- [x] `https://jiosi-inbox-api.onrender.com/login/oauth2/code/google` (can remain as secondary/direct backup)

Under `Authorized JavaScript origins`:
- [x] `http://localhost:5173`
- [x] `http://localhost:8080`
- [x] `https://inbox.jiosi.online`

### B. Render Environment Variables (`jiosi-inbox-api`)
Ensure the following are set in the Render Dashboard:
- `SPRING_PROFILES_ACTIVE`: `prod`
- `FRONTEND_URL`: `https://inbox.jiosi.online`
- `GOOGLE_CLIENT_ID`: `<your-google-client-id>.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET`: `<your-google-client-secret>`
- `GOOGLE_REDIRECT_URI`: `https://inbox.jiosi.online/login/oauth2/code/google` *(Optional, as this is now the default in `application-prod.yml`)*

### C. Vercel Environment Variables (`frontend`)
Ensure:
- `VITE_API_BASE_URL`: Left empty or set to `/api/v1` (letting Vercel proxy handle requests via `vercel.json`).

---

## 6. Next Steps & Approval Gate
All changes are cleanly implemented on branch `fix/production-google-oauth`.
No commits have been pushed, and no deployments have been triggered.
Awaiting your review and explicit approval before staging/committing.
