# JIOSI Inbox — Local Development Setup Guide

This guide walks you through setting up and running the JIOSI Inbox platform locally for development and testing.

---

## 1. Prerequisites

Ensure the following tools are installed:
- **Node.js**: v20+ or v24+ (`node -v`, `npm -v`)
- **Java**: OpenJDK 21 LTS (`java -version`)
- **Maven**: 3.9+ or use the provided wrapper (`./mvnw` / `mvnw.cmd`)
- **Docker & Docker Compose**: v2.20+ or Docker Desktop

---

## 2. Environment Configuration

1. In the repository root, copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Inspect and adjust variables in `.env` if necessary:
   ```dotenv
   POSTGRES_HOST=postgres
   POSTGRES_PORT=5432
   POSTGRES_DB=jiosi_inbox
   POSTGRES_USER=jiosi_user
   POSTGRES_PASSWORD=jiosi_secure_password_example
   HOST_POSTGRES_PORT=5433

   SERVER_PORT=8080
   SPRING_PROFILES_ACTIVE=dev
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://inbox.jiosi.online

   VITE_API_BASE_URL=http://localhost:8080
   FRONTEND_PORT=5173
   ```

> **Note**: Host port `5433` is mapped for PostgreSQL to prevent collision with any existing local PostgreSQL service running on default port `5432`.

---

## 3. Running with Docker Compose (Recommended)

To launch the complete three-tier stack (PostgreSQL, Spring Boot Backend, React Frontend):

```bash
docker compose up -d
```

Verify service status:
```bash
docker compose ps
```

Access the application:
- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API Health**: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
- **PostgreSQL**: `localhost:5433` (DB: `jiosi_inbox`, User: `jiosi_user`)

To view live container logs:
```bash
docker compose logs -f
```

To stop containers:
```bash
docker compose down
```

---

## 4. Hybrid / Local Development Workflow

For active code changes with hot-reload:

### Step 1: Start PostgreSQL in Docker
```bash
docker compose up -d postgres
```

### Step 2: Run Spring Boot Backend
In the `backend` directory:
```bash
cd backend
# On Linux/macOS
./mvnw spring-boot:run
# On Windows
.\mvnw.cmd spring-boot:run
```
The backend starts on `http://localhost:8080` and applies Flyway migrations automatically.

### Step 3: Run React Frontend
In the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server launches on `http://localhost:5173`.

---

## 5. Running Automated Tests

### Backend Unit & Integration Tests
```bash
cd backend
mvn test
```
*Runs application context loading tests and MockMvc HTTP health checks against an in-memory H2 database.*

### Frontend Checks (Linting, Types & Production Build)
```bash
cd frontend
npm run lint       # ESLint verification
npm run typecheck  # TypeScript compiler check
npm run build      # Production bundle generation
```

---

## 6. Verifying Frontend-Backend Connectivity

Send a GET request to the health endpoint:
```bash
curl -i http://localhost:8080/api/v1/health
```

Expected Response (`200 OK`):
```json
{
  "success": true,
  "message": "System health report",
  "data": {
    "status": "UP",
    "application": "JIOSI Inbox Core API",
    "version": "0.1.0-alpha",
    "environment": "dev",
    "timestamp": "2026-11-02T10:45:00Z",
    "uptimeMs": 1420,
    "services": {
      "database": {
        "status": "UP",
        "databaseProduct": "PostgreSQL"
      }
    }
  },
  "timestamp": "2026-11-02T10:45:00Z"
}
```
In the frontend UI, the health badge in the left sidebar will display: `API: Healthy · Xms`.
