# JIOSI Inbox — Pre-Merge Security & Production Readiness Audit Report

**Date of Audit:** November 4, 2026  
**Auditor:** Senior Staff Security & Production Reliability Architect  
**Repository:** `shivam-shukla888/inbox.jiosi.online`  
**Base Branch:** `main`  
**Feature Branch:** `feature/day-2-google-oidc-auth` (Head: `d2d4e5d`)  
**Deployment Infrastructure:** Vercel (Frontend SPA) + Render (Spring Boot Docker) + Neon PostgreSQL (Serverless AWS Singapore)  
**Budgetary Constraint:** Strict ₹0/month (Free Tier architecture)  

---

## 1. Executive Summary & Verdict

| Audit Parameter | Status | Details |
| :--- | :--- | :--- |
| **Final Merge Verdict** | **SAFE TO MERGE** | All core security controls verified; all 85 backend and 46 frontend tests pass. |
| **Git & Commit Cleanliness** | **PASS** | 9 commits cleanly reviewed; zero secrets or credentials committed in history. |
| **Secrets & Keys** | **PASS** | AES-256-GCM encryption for stored tokens; environment variable binding only; startup fail-fast validation. |
| **Backend & OAuth Security** | **PASS** | Scope strictly `gmail.readonly`; CSRF with cookie token repository; per-user and per-workspace database isolation. |
| **Database & Migrations** | **PASS** | Flyway V1–V4 cleanly separated; DDL routed to direct unpooled Neon connection; runtime queries on PgBouncer pooler. |
| **Frontend Security** | **PASS** | 0 occurrences of `dangerouslySetInnerHTML` or `innerHTML`; DOMPurify/escaped text rendering; honest UI states. |
| **Deployment & Containers** | **PASS** | Dockerfile multi-stage build verified on 512MB RAM; Vercel SPA routing & backend API proxy configured. |
| **Automated Test Suite** | **PASS** | Backend: 85/85 passed (0 failures). Frontend: 46/46 passed (0 failures). TypeScript: 0 errors. |

> [!IMPORTANT]
> **VERDICT: SAFE TO MERGE WITH STATED PRODUCTION PREREQUISITES**  
> Branch `feature/day-2-google-oidc-auth` is architecturally sound, thoroughly tested, and ready to be merged into `main`. The production environment variables (Google OAuth Secret, Neon connection strings, JWT secret) must be configured in Render and Vercel before initiating user traffic.

---

## 2. Phase 1 — Repository & Git Audit

### 2.1 Branch Diff & Commit History
Between `main` and `feature/day-2-google-oidc-auth`, 9 commits and 67 changed files were audited:

1. `8de626d` — `feat(auth): implement secure Google OIDC authentication`
2. `610d4bb` — `fix(security): explicit cookie attributes and docker compose defaults`
3. `1bb5dcb` — `docs(security): record final independent verification matrix and line endings`
4. `f17acdd` — `fix(auth): resolve Google OAuth configuration and secure login UI`
5. `e4b1402` — `feat(ui): redesign authentication screen to match JIOSI editorial aesthetic`
6. `f950330` — `fix(auth): exclude auth endpoints from workspace authorization and dynamically bind workspace`
7. `1396687` — `docs(day-3): add zero-cost scale architecture and gmail sync plan`
8. `382e0b8` — `feat(gmail): integrate read-only gmail api with aes-256-gcm token encryption`
9. `d2d4e5d` — `fix(docker): implement multi-stage build for render deployment and 512mb jvm tuning`

### 2.2 Git Ignore & Secret File Verification
- `git status --short`: Clean working tree.
- `git check-ignore -v .env .env.local`: Confirmed ignored by `.gitignore:13` and `.gitignore:14`.
- `git ls-files .env .env.local .neon`: Confirmed untracked.
- Commit history grep for real private keys, API keys, passwords, and tokens: **ZERO leaked secrets**.
- Tracked `.env.example` contains only non-secret placeholders (`google-client-id-placeholder`, `jiosi_secure_password_example`).

---

## 3. Phase 2 — Secrets, Credentials & Key Management

1. **Storage Security**:
   - OAuth access and refresh tokens are encrypted at rest using AES-256-GCM (`TokenEncryptionService`).
   - Initialization Vectors (IVs) are 96-bit cryptographically secure random bytes generated per encryption operation.
   - Decryption occurs strictly inside the backend JVM. No plaintext tokens are sent to frontend clients or logged.
2. **Key Derivation & Fail-Safe Startup**:
   - Encryption keys are derived via SHA-256 from the master `JWT_SECRET` / encryption key secret.
   - `OAuthConfigValidator` runs on Spring Boot startup (`@EventListener(ApplicationReadyEvent.class)`):
     - In `prod` profile, missing or placeholder values for `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, or `JWT_SECRET` immediately abort application boot with a clean error message.

---

## 4. Phase 3 — Backend Security & Architecture Audit

1. **CSRF Protection**:
   - Configured via `CookieCsrfTokenRepository.withHttpOnlyFalse()` with `CsrfTokenRequestAttributeHandler`.
   - Cookie-authenticated state-changing methods (`POST`, `PUT`, `PATCH`, `DELETE`) require the `X-XSRF-TOKEN` header.
   - Public authentication endpoints (`/oauth2/**`, `/login/oauth2/**`, `/api/v1/auth/google`, `/api/v1/health`) are explicitly matched and permitted.
   - Bearer token requests bypass CSRF checks as they are not subject to browser ambient authority.
2. **Session Security & Fixation**:
   - Session fixation protection enabled (`migrateSession()`).
   - Session cookies configured with `HttpOnly: true`, `SameSite: Lax`, and `Secure: true` in production profile.
   - `server.forward-headers-strategy: framework` enabled to correctly handle `X-Forwarded-Proto` and `X-Forwarded-Host` behind Render and Cloudflare reverse proxies.
3. **CORS Hardening**:
   - `CorsConfig` enforces allowed origins via `CORS_ALLOWED_ORIGINS`.
   - Default includes `http://localhost:5173`, `http://localhost:3000`, `https://inbox.jiosi.online`, and `https://jiosi-inbox-api.onrender.com`.
4. **Resilience & Rate Limiting**:
   - `GmailApiClient` implements exponential backoff with jitter on HTTP 429 and 5xx responses.
   - 3 retry attempts maximum before failing fast.

---

## 5. Phase 4 — Google OAuth 2.0 & Gmail Integration Audit

1. **Scope Minimization**:
   - OAuth scope strictly restricted to `https://www.googleapis.com/auth/gmail.readonly`.
   - Prohibited scopes (`gmail.modify`, `gmail.send`, `mail.google.com`) are absent.
2. **Offline Token Acquisition**:
   - `CustomOAuth2AuthorizationRequestResolver` explicitly injects `access_type=offline` and `prompt=consent` during Google authorization.
   - Guarantees retrieval of a refresh token on account connection.
3. **Token Refresh Lifecycle**:
   - `GmailService` checks `tokenExpiresAt` against current timestamp (with a 60-second buffer).
   - If expired, securely requests a new access token from Google's token endpoint using the decrypted refresh token, re-encrypts the new access token, and persists it.
4. **Revocation & Disconnect**:
   - Disconnecting an account triggers Google token revocation endpoint (`https://oauth2.googleapis.com/revoke`) and removes credentials from `connected_accounts`.
5. **Per-User Mailbox Isolation**:
   - All message list and detail endpoints enforce queries scoped to `userId` derived from the authenticated security context.
   - Cross-user data retrieval attempts return HTTP 404 or 403.

---

## 6. Phase 5 — Database & Neon PostgreSQL Security Audit

1. **Architecture & Pooling**:
   - Runtime transactions connect to Neon's PgBouncer connection pooler (`-pooler` host) with HikariCP configured for serverless scaling (`maximum-pool-size: 10`, `idle-timeout: 300000ms`, `max-lifetime: 600000ms`).
   - DDL migrations (`Flyway`) connect via `FLYWAY_URL` to the direct unpooled endpoint (`DATABASE_DIRECT_URL`), ensuring transactional advisory locks (`pg_advisory_lock`) succeed without pool drops.
2. **Migration Files**:
   - `V1__init_schema.sql`: Workspaces, users, threads, drafts.
   - `V2__email_domain.sql`: Email threads, messages, attachments.
   - `V3__google_identity.sql`: Google subject binding and profile metadata.
   - `V4__gmail_oauth_tokens.sql`: Encrypted OAuth token storage, history IDs, sync timestamps.
3. **Integrity & Indexing**:
   - Unique constraints on `(user_id, provider, email_address)` in `connected_accounts`.
   - Index on `user_id` and `workspace_id` for zero cross-tenant leak.

---

## 7. Phase 6 — Frontend Security Audit

1. **Cross-Site Scripting (XSS) Prevention**:
   - Audit of `frontend/src/`: **0** occurrences of `dangerouslySetInnerHTML` and **0** occurrences of raw `innerHTML`.
   - `EmailDetail.tsx` renders message body via React text nodes with CSS `whitespace-pre-line`, preventing HTML injection by design.
2. **Honest State Rendering**:
   - Inbox Zero states are displayed honestly when backend returns empty lists.
   - Offline banner cleanly surfaces when backend connectivity is interrupted, with simulation fallback explicitly labeled.
3. **Content Security Policy**:
   - Configured in `frontend/vercel.json` and `frontend/nginx.conf`:
     - `default-src 'self'`
     - `frame-ancestors 'none'`
     - `X-Frame-Options: DENY`
     - `X-Content-Type-Options: nosniff`

---

## 8. Phase 7 — Deployment Configuration Audit

1. **Vercel Frontend Configuration (`frontend/vercel.json`)**:
   - Single-Page Application (SPA) fallback rewrite configured (`/(.*) -> /index.html`) so direct navigation to `/overview`, `/settings`, `/privacy`, `/terms`, or `/login/oauth2/code/google` does not return HTTP 404.
   - API and OAuth reverse proxy rewrites:
     - `/api/:path*` -> `https://jiosi-inbox-api.onrender.com/api/:path*`
     - `/oauth2/:path*` -> `https://jiosi-inbox-api.onrender.com/oauth2/:path*`
     - `/login/oauth2/:path*` -> `https://jiosi-inbox-api.onrender.com/login/oauth2/:path*`
2. **Render Backend Multi-Stage Dockerfile (`backend/Dockerfile`)**:
   - Stage 1: `maven:3.9.9-eclipse-temurin-21-alpine` compiles and packages the Spring Boot JAR inside the build container.
   - Stage 2: `eclipse-temurin:21-jre-alpine` runtime container with non-root user `jiosi` (UID 10001).
   - JVM Memory Tuning: `-Xms128m -Xmx384m -XX:+UseSerialGC -XX:MaxRAMPercentage=75.0` specifically configured to eliminate OOM kills on Render Free Tier (512 MB RAM).
3. **Live Container Test**:
   - Tested local container build (`jiosi-inbox-backend:test`). Container booted Tomcat on port 8080 and passed live health check against Neon DB with HTTP 200 `UP`.

---

## 9. Phase 8 — Production Hardening & Profiles

1. **Production Profile (`application-prod.yml`)**:
   - Enabled via `SPRING_PROFILES_ACTIVE=prod`.
   - `server.servlet.session.cookie.secure: true` enforced.
   - `server.servlet.error.include-stacktrace: never` and `include-exception: false` to prevent leaking framework traces.
   - `org.hibernate.SQL: WARN` to prevent sensitive query logging in production logs.
2. **Forwarded Headers**:
   - `server.forward-headers-strategy: framework` enabled in `application.yml` and `application-prod.yml`.

---

## 10. Phase 9 — Automated Verification & Test Results

### 10.1 Backend Test Suite (Spring Boot 3.3.5 / Java 21)
```text
[INFO] Results:
[INFO] 
[INFO] Tests run: 85, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  28.598 s
```
- Integration tests: `EmailDraftApiTest`, `SecurityAndCorsApiTest`, `RepositoryIntegrationTest`, `WorkspaceIsolationTest`, `GmailIntegrationTests`
- Unit tests: `GoogleAuthUnitTests` (18 unit tests covering identity collisions, unverified emails, token encryption, and workspace access)
- Live Production Profile Startup (`SPRING_PROFILES_ACTIVE=prod`): Booted packaged JAR against Neon DB, Flyway verified 4 migrations, HikariCP connected to PgBouncer pooler, and `GET /api/v1/health` returned HTTP 200 `UP`.

### 10.2 Frontend Test Suite (React 18 + Vitest)
```text
 Test Files  4 passed (4)
      Tests  46 passed (46)
   Duration  13.88s
```
- `ui-components.test.tsx` (11 tests passed)
- `auth-components.test.tsx` (15 tests passed)
- `inbox-components.test.tsx` (11 tests passed)
- `app-integration.test.tsx` (9 tests passed)

### 10.3 Frontend Compilation & Bundling
- `tsc --noEmit`: 0 errors.
- `vite build`: Production bundle generated cleanly in `frontend/dist/` (HTML: 2.48 kB, CSS: 54.70 kB, JS: 326.98 kB).

---

## 11. Phase 10 — Confirmed Issues & Remediations Applied

| Issue Identified | Severity | Status | Remediation Applied |
| :--- | :--- | :--- | :--- |
| **Missing `target/*.jar` on Render Docker build** | High | **RESOLVED** | Converted `backend/Dockerfile` to multi-stage Maven build; verified on local Docker runner. |
| **Missing Vercel SPA rewrites and proxying** | High | **RESOLVED** | Created `frontend/vercel.json` with SPA routing fallback and Render API/OAuth proxy rewrites. |
| **Unparameterized session cookie security** | Medium | **RESOLVED** | Added `SESSION_COOKIE_SECURE:false` default for dev and `secure: true` in `application-prod.yml`. |
| **Missing reverse proxy header strategy** | Medium | **RESOLVED** | Added `forward-headers-strategy: framework` so Spring Boot respects HTTPS protocol behind Render/Vercel. |
| **Missing production profile configuration** | Medium | **RESOLVED** | Created `backend/src/main/resources/application-prod.yml` suppressing stack traces and setting prod log levels. Tested live startup with `SPRING_PROFILES_ACTIVE=prod` connected to Neon DB; health endpoint returned HTTP 200 `UP`. |
| **API Client Base URL fallback in production** | Medium | **RESOLVED** | Updated `frontend/src/api/client.ts` to fallback to `""` (relative path) in production when `VITE_API_BASE_URL` is unset, preventing mixed-content localhost calls and leveraging Vercel rewrites. |
| **Unsanitized email body injection risk** | Low | **RESOLVED** | Verified React text node escaping in `EmailDetail.tsx` without `dangerouslySetInnerHTML`. |

---

## 12. Phase 11 — Pre-Merge Checklist & Deployment Guide

### 12.1 Pre-Merge Validation Commands (All Passed)
```bash
# 1. Verify working tree
git status --short

# 2. Verify git diff formatting
git diff --check

# 3. Verify backend tests
cd backend && ./mvnw test

# 4. Verify frontend build and tests
cd frontend && npm run typecheck && npm run build && npm test -- --run
```

### 12.2 Required Production Environment Variables
Before running traffic in production, verify these environment variables are set in the respective hosting dashboards:

#### In Render (`jiosi-inbox-api` Web Service):
- `SPRING_PROFILES_ACTIVE`: `prod`
- `DATABASE_URL`: Neon pooled JDBC URL (`jdbc:postgresql://<neon-host>-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&prepareThreshold=0`)
- `DATABASE_USERNAME`: `neondb_owner`
- `DATABASE_PASSWORD`: `<NEON_PASSWORD>`
- `FLYWAY_URL`: Neon direct JDBC URL (`jdbc:postgresql://<neon-host>.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`)
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- `JWT_SECRET`: Minimum 32-byte cryptographically secure random string
- `FRONTEND_URL`: `https://inbox.jiosi.online`
- `SESSION_COOKIE_SECURE`: `true`

#### In Vercel (`inbox.jiosi.online` Project):
- `VITE_API_BASE_URL`: `https://jiosi-inbox-api.onrender.com` (or leave empty if using Vercel proxy rewrite)

#### In Google Cloud Console:
- Authorized JavaScript Origins:
  - `https://inbox.jiosi.online`
  - `https://jiosi-inbox-api.onrender.com`
  - `http://localhost:5173`
  - `http://localhost:8080`
- Authorized Redirect URIs:
  - `https://inbox.jiosi.online/login/oauth2/code/google`
  - `https://jiosi-inbox-api.onrender.com/login/oauth2/code/google`
  - `http://localhost:8080/login/oauth2/code/google`

---

## 13. Final Declaration

**Audit Status:** COMPLETE  
**Branch Verdict:** **SAFE TO MERGE**  
**Action Item for Repository Owner:** Merge `feature/day-2-google-oidc-auth` into `main` after verifying the production environment variables in Render and Vercel.

