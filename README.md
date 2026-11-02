# JIOSI Inbox

> **Your inbox, intelligently managed.**  
> *Read less. Understand faster. Respond smarter.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Java 21](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://adoptium.net)
[![Spring Boot 3.3.5](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React 18](https://img.shields.io/badge/React-18%20%2B%20TypeScript-blue.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com)
[![Docker Compose](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://docker.com)

Company: [JIOSI AI](https://jiosi.online)  
Application Target: [https://inbox.jiosi.online](https://inbox.jiosi.online)

---

## 1. About JIOSI Inbox

**JIOSI Inbox** is an AI-powered email productivity platform engineered for knowledge workers, founders, and teams buried under email overload. Rather than another cluttered corporate dashboard, JIOSI Inbox adopts an opinionated, keyboard-first, distraction-free workflow inspired by high-velocity tools like Linear and Superhuman.

---

## 2. Day 1 Deliverables Summary

Today's focus established the core architectural foundation:

- **Repository Foundation**: Standardized monorepo layout with clean separation between `backend/`, `frontend/`, `docs/`, and orchestration.
- **Frontend Foundation**: React 18 + TypeScript + Vite + Tailwind CSS implementing the **"Warm Precision Editorial"** design system generated via Stitch MCP.
- **Backend Foundation**: Java 21 LTS + Spring Boot 3.3.5 featuring modular packages (`config`, `health`, `common`, `user`, `workspace`, `connectedaccount`), global error handling, and structured REST responses.
- **Database Foundation**: PostgreSQL 16 managed by Flyway migrations (`V1__init_schema.sql`) for `users`, `workspaces`, `workspace_members`, and `connected_accounts`.
- **Docker Orchestration**: Complete `docker-compose.yml` orchestrating PostgreSQL (with healthchecks and persistent volumes), the Spring Boot backend, and the React frontend.
- **Frontend-Backend Integration**: Centralized API client with dynamic backend health telemetry (`GET /api/v1/health`), latency tracking, and zero hardcoded assumptions.
- **Automated Testing**: 100% test pass rate across Spring Boot MockMvc tests, H2 in-memory DB tests, ESLint, TypeScript compiler checks, and Vite production builds.
- **Security & Privacy**: Zero committed secrets, isolated `.env`, non-root container user, and strict exclusions of real credentials or OAuth tokens.

---

## 3. Architecture Overview

```
[ Browser / Client ]
        │
        ├──> React 18 + TypeScript + Tailwind (Port 5173 / 3000)
        │       │
        │       └──> Centralized API Client (VITE_API_BASE_URL)
        │               │
        │               ▼
        └──> Spring Boot 3.3.5 Backend (Port 8080)
                │
                ├──> GET /api/v1/health (Dependency Telemetry)
                ├──> Global Exception Handling & CORS
                └──> Spring Data JPA + Flyway Migrations
                        │
                        ▼
             PostgreSQL 16 Engine (Port 5432 / Host 5433)
```

For full architectural blueprints, see [docs/architecture.md](docs/architecture.md).

---

## 4. Quick Start

### Option A: Launch with Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/shivam-shukla888/inbox.jiosi.online.git
   cd inbox.jiosi.online
   ```
2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Start the containers:
   ```bash
   docker compose up -d
   ```
4. Open the application:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API Health**: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)

### Option B: Local Developer Mode

See [docs/development-setup.md](docs/development-setup.md) for running the backend and frontend locally with live hot-reloading.

---

## 5. Keyboard Navigation Shortcuts

JIOSI Inbox supports fast single-key and modifier commands:

| Shortcut | Action |
|---|---|
| `⌘K` or `Ctrl+K` | Open Command Palette |
| `C` | Compose new message |
| `E` | Archive active message |
| `J` / `↓` | Navigate to next message |
| `K` / `↑` | Navigate to previous message |
| `⌘E` | Mark selected messages as read |
| `?` | Keyboard shortcut helper |

---

## 6. Verification and Testing

### Backend Test Suite
```bash
cd backend
mvn test
```

### Frontend Checks
```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

---

## 7. Next Milestones (Day 2 Preview)

- User authentication & session management (OAuth2 / JWT).
- Gmail & IMAP integration connectors.
- Real-time sync engine.
- Production AI summarizer and smart draft pipelines.

---

## 8. License

This project is licensed under the [MIT License](LICENSE).
