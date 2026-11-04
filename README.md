# JIOSI Inbox
### by Shivsastra

> **Your inbox, intelligently managed.**  
> *Read less. Understand faster. Respond smarter.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Java 21](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://adoptium.net)
[![Spring Boot 3.3.5](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React 18](https://img.shields.io/badge/React-18%20%2B%20TypeScript-blue.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com)
[![Docker Compose](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://docker.com)
[![CI Workflow](https://img.shields.io/badge/CI-GitHub%20Actions-blue.svg)](.github/workflows/ci.yml)

Brand: **Shivsastra**  
Product: **JIOSI Inbox by Shivsastra**  
Website: [https://jiosi.online](https://jiosi.online)  
Application Target: [https://inbox.jiosi.online](https://inbox.jiosi.online)

---

## 1. About JIOSI Inbox

**JIOSI Inbox** is an AI-powered email productivity SaaS platform engineered for knowledge workers, founders, and modern teams buried under communication overload. Rather than another cluttered corporate dashboard, JIOSI Inbox provides an opinionated, keyboard-first, distraction-free workflow inspired by high-velocity tools like Linear and Superhuman.

---

## 2. Production Architecture & Highlights

- **Authentication & Multi-Tenant Authorization**:
  - Secure HMAC-SHA256 Bearer Token session issuance via `POST /api/v1/auth/token`.
  - Strict Interceptor-level authorization (`SecurityInterceptor`): Every API request to `/api/v1/threads/**`, `/api/v1/drafts/**`, etc., validates both token integrity and user membership in the requested `X-Workspace-Id`.
  - Zero cross-workspace data bleed: Attempting to access another workspace's records returns HTTP 403 Forbidden.
- **Truthful State Architecture**:
  - Empty mailbox states are rendered honestly ("Inbox Zero") when the server returns 0 threads, preventing stale demo content from disguising real customer mail.
  - When backend APIs are unavailable, an honest offline banner is presented, with explicit toggle into "Simulation Preview Active".
  - Thread mutations (star, snooze, archive, draft saving, reply) provide immediate visual feedback with optimistic updates and graceful rollbacks.
- **Responsive Mobile Flow**:
  - Adaptive 3-panel collapsible layout on desktop; single-panel mobile flow with `list → message detail → back-to-list` navigation, safe touch targets, floating compose, and bottom navigation.
- **Public SEO & Legal Assets**:
  - Private authenticated routes are protected with `noindex, nofollow` meta tags and blocked in `robots.txt`.
  - Public marketing and legal pages are indexed: Product Overview (`/overview`), Privacy Policy (`/privacy`), Terms of Service (`/terms`), and Help & Support (`/support`).
  - Standard `favicon.svg`, `sitemap.xml`, and PWA `manifest.webmanifest`.
- **Hardened Nginx & Container Security**:
  - Content-Security-Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
  - Non-root container users (`jiosi` UID) across backend and frontend containers.
  - GitHub Actions CI workflow in `.github/workflows/ci.yml`.

---

## 3. Architecture Overview

```
[ Browser / Client ]
        │
        ├──> React 18 + TypeScript + Tailwind (Port 3000 / 5173)
        │       │
        │       ├──> Authorization: Bearer <HMAC-SHA256 Token>
        │       ├──> X-Workspace-Id: <UUID>
        │       └──> Centralized API Client
        │               │
        │               ▼
        └──> Spring Boot 3.3.5 Backend (Port 8080)
                │
                ├──> SecurityInterceptor (401 Unauthenticated / 403 Forbidden)
                ├──> GET /api/v1/health (Dependency Telemetry)
                ├──> REST Controllers: Threads, Drafts, Auth, Workspaces
                └──> Spring Data JPA + Flyway Migrations
                        │
                        ▼
             PostgreSQL 16 Engine (Port 5432 / Host 5433)
```

---

## 4. Database & Neon PostgreSQL Integration

JIOSI Inbox supports both local containerized PostgreSQL and serverless **Neon PostgreSQL**:

- **Neon Serverless Architecture**:
  - **Connection Pooling**: Uses Neon's PgBouncer pooler (`-pooler` host) for high-concurrency runtime queries with `prepareThreshold=0` to guarantee stability in transaction pooling mode.
  - **HikariCP Configuration**: Tuned for Neon Free tier characteristics:
    - `maximum-pool-size: 10`: Conservative pool size preventing compute exhaustion.
    - `minimum-idle: 2`: Ensures immediate readiness for warm requests.
    - `connection-timeout: 30000ms`: Accommodates serverless cold starts.
    - `idle-timeout: 300000ms`: Releases idle connections after 5 minutes.
    - `max-lifetime: 600000ms`: Shorter than PgBouncer server timeout to cycle connections cleanly.
    - `keepalive-time: 60000ms`: Emits TCP keepalives to prevent NAT/firewall drops.
    - `leak-detection-threshold: 60000ms`: Detects hanging queries.
  - **Flyway Migrations**: Automatically routes DDL migrations (`V1__init_schema.sql`, `V2__email_domain.sql`, `V3__google_identity.sql`) to Neon's **direct unpooled connection** (`FLYWAY_URL`), ensuring full session-level advisory lock (`pg_advisory_lock`) support without transaction pool drops.
  - **Zero-Secret Commits**: All Neon credentials reside in `.env.local` (gitignored).

---

## 5. Quick Start

### Launch with Docker Compose (Production-Ready)

1. Clone the repository:
   ```bash
   git clone https://github.com/shivam-shukla888/inbox.jiosi.online.git
   cd inbox.jiosi.online
   ```
2. Start the stack:
   ```bash
   docker compose up -d --build
   ```
3. Access the services:
   - **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
   - **Product Overview**: [http://localhost:3000/overview](http://localhost:3000/overview)
   - **Privacy Policy**: [http://localhost:3000/privacy](http://localhost:3000/privacy)
   - **Terms of Service**: [http://localhost:3000/terms](http://localhost:3000/terms)
   - **Help & Support**: [http://localhost:3000/support](http://localhost:3000/support)
   - **Backend API Health**: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)

---

## 6. Keyboard Navigation Shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` or `Ctrl+K` | Open Command Palette |
| `C` | Compose new message |
| `E` | Archive active message |
| `H` | Snooze active message |
| `S` | Star / unstar active message |
| `R` | Reply to current message |
| `J` / `↓` | Navigate to next message |
| `K` / `↑` | Navigate to previous message |
| `Escape` | Dismiss modal, compose, or return to list |
| `?` | Keyboard shortcut helper |

---

## 7. Verification and Automated Testing

### Backend Test Suite (71 / 71 Passing)
```bash
cd backend
mvn clean test
```
Tests cover:
- Google OIDC ID token validation and authentication
- User auto-provisioning and default workspace bootstrap
- Multi-tenant cross-workspace isolation (HTTP 403 enforcement)
- Missing workspace header handling (HTTP 400)
- Email threads & drafts CRUD operations with pagination & concurrency
- PostgreSQL Flyway schema migration validation & seed data
- Neon serverless connection resilience & HikariCP pooling

### Frontend Quality Checks (46 / 46 Passing)
```bash
cd frontend
npm run lint         # Zero ESLint warnings or errors
npm run typecheck    # Zero TypeScript compiler errors
npm test -- --run    # 46 / 46 Vitest integration and unit tests passing
npm run build        # Production bundle built cleanly with gzip optimization
```

---

## 8. Customer Email Data Safety Statement

> **CRITICAL DATA GOVERNANCE POLICY**:  
> In compliance with enterprise SaaS privacy standards:
> 1. Customer email content, attachments, and personal recipient metadata are strictly partitioned by database `workspace_id`.
> 2. Connecting external mailboxes (Gmail, Microsoft 365, IMAP) utilizes zero-token client-side exposure. OAuth credentials and tokens must be stored encrypted at rest via hardware security modules (HSM) or cloud KMS.
> 3. User mail is never used to train generalized LLM models without explicit affirmative consent.
> 4. Real email ingestion requires registered Google Cloud / Azure OAuth application credentials configured with appropriate scopes (`https://www.googleapis.com/auth/gmail.modify`).

---

## 8. Owner / Legal Counsel Confirmation Checklist

The following items are flagged `[OWNER CONFIRMATION REQUIRED]` prior to public production deployment:

- [ ] **Privacy Policy Legal Review**: Confirm final corporate jurisdiction, designated Data Protection Officer (DPO) contact email (`privacy@jiosi.online`), and GDPR/CCPA data retention schedule.
- [ ] **Terms of Service Sign-Off**: Confirm dispute resolution forum, limitation of liability thresholds ($100 or 12-month fees paid), and AI draft disclaimer language.
- [ ] **OAuth Application Verification**: Register Google Workspace & Microsoft Entra client credentials for JIOSI AI and complete security assessment audits for restricted email scopes.
- [ ] **Transactional Email Provider**: Provision production SMTP/API sending service (e.g. Amazon SES, Postmark, Resend) for real outbound communications.
- [ ] **DNS & SSL Provisioning**: Bind `inbox.jiosi.online` to production load balancer with automated Let's Encrypt / Cloudflare SSL certificates.

---

## 9. License

This project is licensed under the [MIT License](LICENSE).
