# JIOSI Inbox — System Architecture

## 1. System Overview

**JIOSI Inbox** is an AI-augmented email productivity platform engineered for high-velocity triage, executive workflows, and cognitive calm.

Target production URL: `https://inbox.jiosi.online`  
Main website: `https://jiosi.online`

The Day 1 architecture delivers an enterprise-grade technical foundation comprising a decoupled three-tier architecture:

```
┌────────────────────────────────────────────────────────┐
│                    Web Clients                         │
│  React 18 + TypeScript + Vite + Tailwind CSS (Port 5173/3000)│
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON REST
                           ▼
┌────────────────────────────────────────────────────────┐
│              Backend Application Tier                  │
│       Spring Boot 3.3.5 / Java 21 (Port 8080)          │
│                                                        │
│   ┌──────────────┐   ┌──────────────┐   ┌────────────┐ │
│   │  Health API  │   │  CORS & Web  │   │ Validation │ │
│   └──────────────┘   └──────────────┘   └────────────┘ │
│   ┌──────────────────────────────────────────────────┐ │
│   │      Domain Repositories & JPA Entities          │ │
│   └──────────────────────────────────────────────────┘ │
└──────────────────────────┬─────────────────────────────┘
                           │ JDBC / HikariCP Pool
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Data Tier                            │
│           PostgreSQL 16 + Flyway Migrations            │
│               (Internal Port 5432)                     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack Rationale

### Frontend
- **React 18 + TypeScript**: Strong compile-time typing, predictable state management, and component reusability.
- **Vite**: Rapid Hot Module Replacement (HMR) and optimized Rollup production builds.
- **Tailwind CSS**: Utility-first CSS configured with custom design tokens from the "Warm Precision Editorial" design system.
- **Lucide React**: Clean, consistent SVG iconography.

### Backend
- **Java 21 (LTS) & Spring Boot 3.3.5**: Robust type safety, proven concurrency model, rich enterprise ecosystem, and modular packaging.
- **Spring Web & Validation**: Standard REST controller architecture with declarative `@Valid` annotations.
- **Spring Data JPA & Hibernate 6**: Object-relational mapping with type-safe repository interfaces.
- **Flyway**: Deterministic, version-controlled database schema migrations.
- **Spring Boot Actuator**: Native telemetry and operational health checks.

### Database
- **PostgreSQL 16**: Relational integrity, ACID compliance, native JSONB support for future email metadata, and index capabilities.

### Containerization & Orchestration
- **Docker & Docker Compose**: Multi-stage builds for minimal attack surface and reproducible environments across local and CI/CD environments.

---

## 3. Package and Directory Organization

```
inbox/
├── .env.example              # Canonical template for environment variables
├── .gitignore                # Production ignore rules
├── docker-compose.yml        # Orchestration for PostgreSQL, Backend, Frontend
├── README.md                 # Primary project overview and quick start
├── docs/                     # Technical specifications & reports
│   ├── architecture.md
│   ├── development-setup.md
│   └── day-1-report.md
├── backend/                  # Spring Boot application
│   ├── Dockerfile            # Multi-stage Java container build
│   ├── pom.xml               # Maven build and dependency configuration
│   ├── mvnw / mvnw.cmd       # Maven wrapper binaries
│   └── src/
│       ├── main/
│       │   ├── java/com/jiosi/inbox/
│       │   │   ├── JiosiInboxApplication.java
│       │   │   ├── common/       # ApiResponse, ErrorResponse, GlobalExceptionHandler
│       │   │   ├── config/       # CorsConfig, WebMvc configuration
│       │   │   ├── health/       # HealthController, HealthResponse DTOs
│       │   │   ├── user/         # User entity & UserRepository
│       │   │   ├── workspace/    # Workspace, WorkspaceMember entities & repos
│       │   │   └── connectedaccount/ # ConnectedAccount entity & repo
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/
│       │           └── V1__init_schema.sql
│       └── test/                 # Spring Boot & MockMvc integration tests
└── frontend/                 # React TypeScript application
    ├── Dockerfile            # Multi-stage Node + Nginx container build
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── api/client.ts     # Centralized HTTP API client with latency timing
        ├── types/            # TypeScript interfaces (email, health, user)
        ├── data/             # Realistic demonstration data (mockEmails.ts)
        ├── components/
        │   ├── ui/           # Button, Badge, Input, Kbd, HealthBadge, EmptyState
        │   ├── layout/       # AppShell, Sidebar, Header
        │   └── inbox/        # EmailList, EmailListItem, EmailDetail, Compose, CommandPalette
        └── App.tsx
```

---

## 4. Database Schema Design (Flyway V1)

The database initializes via Flyway migration `V1__init_schema.sql`:

1. **`users`**:
   - `id`: UUID (Primary Key, default `gen_random_uuid()`)
   - `email`: VARCHAR(255) UNIQUE NOT NULL
   - `full_name`: VARCHAR(150) NOT NULL
   - `avatar_url`: VARCHAR(512)
   - `created_at`, `updated_at`: TIMESTAMPTZ

2. **`workspaces`**:
   - `id`: UUID (Primary Key)
   - `name`: VARCHAR(100) NOT NULL
   - `slug`: VARCHAR(64) UNIQUE NOT NULL
   - `owner_id`: UUID (Foreign Key -> `users.id`)
   - `created_at`, `updated_at`: TIMESTAMPTZ

3. **`workspace_members`**:
   - `id`: UUID (Primary Key)
   - `workspace_id`: UUID (FK -> `workspaces.id` ON DELETE CASCADE)
   - `user_id`: UUID (FK -> `users.id` ON DELETE CASCADE)
   - `role`: VARCHAR(32) NOT NULL (e.g., OWNER, ADMIN, MEMBER)
   - UNIQUE constraint on `(workspace_id, user_id)`

4. **`connected_accounts`**:
   - Records account connection metadata (e.g., Google Workspace, Fastmail)
   - `id`: UUID (Primary Key)
   - `user_id`: UUID (FK -> `users.id` ON DELETE CASCADE)
   - `provider`: VARCHAR(50) NOT NULL
   - `email_address`: VARCHAR(255) NOT NULL
   - `status`: VARCHAR(32) NOT NULL (ACTIVE, NEEDS_REAUTH)
   - `last_sync_at`: TIMESTAMPTZ
   - *Security Guarantee*: No OAuth access tokens, refresh tokens, or mailbox passwords are stored in this table.

---

## 5. Security & Isolation

1. **Secrets Exclusion**:
   - Database passwords, API keys, and sensitive tokens are injected exclusively via environment variables (`.env`).
   - `.gitignore` strictly prohibits checking in `.env` files.
2. **CORS Governance**:
   - Explicit allowed origins configured in `CorsConfig.java`, disallowing wildcard `*` with credentials.
3. **Information Disclosure Prevention**:
   - `GET /api/v1/health` validates database connectivity using connection ping (`isValid(2)`) without exposing database IP addresses, hostnames, usernames, or internal paths.
4. **Least-Privilege Containers**:
   - Backend runs as non-root user `jiosi` inside Alpine Linux.
