# Deployment Guide — ESN FM

## Infrastructure

| Layer | Provider | Notes |
|-------|----------|-------|
| Backend API | Railway | Node.js service |
| Database | Railway | Postgres plugin, same project |
| Frontend | Vercel | Static SPA |
| CI/CD | GitHub Actions | Triggered on push to `dev` / `main` |

---

## GitHub Secrets Required

Add these in **Settings → Secrets and variables → Actions**.

### Environment: `development` (used by `dev` branch deploys)

| Secret | Value |
|--------|-------|
| `RAILWAY_DEV` | Railway API token for the dev service |
| `DATABASE_URL_DEV` | Postgres connection string for the dev Railway database |

### Environment: `production` (used by `main` branch deploys)

| Secret | Value |
|--------|-------|
| `RAILWAY_PROD` | Railway API token for the prod service |
| `DATABASE_URL_PROD` | Postgres connection string for the prod Railway database |
| `VERCEL_TOKEN_ESN_FM` | Vercel personal access token |
| `VERCEL_ORG_ID` | Vercel org/team ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

> **Getting the Railway DATABASE_URL**: Open your Railway project → click the **Postgres** plugin → go to the **Connect** tab → copy the `DATABASE_URL` value.

---

## Railway — Backend Setup

1. Create a Railway project
2. Add a **Postgres** plugin (Railway sets `DATABASE_URL` automatically)
3. Create a **Node** service pointing to the repo root
4. Set these environment variables on the Node service:

```
NODE_ENV=production
JWT_SECRET=<long random string — generate with: openssl rand -hex 32>
PORT=3001
CORS_ORIGINS=https://your-vercel-domain.vercel.app
INVITE_CODE=          # leave empty for open registration
API_URL=https://your-railway-service-url
```

5. The `railway.json` at the repo root handles the build/start commands — do not change it
6. Database migrations are applied automatically by CI/CD before each deploy (see [CI/CD Flow](#cicd-flow) below) — no manual steps needed after the first setup

---

## Vercel — Frontend Setup

1. Import the repo into Vercel
2. Framework preset: **Vite**
3. Root directory: `.` (monorepo root)
4. Build command: `npm run build` (builds `frontend/dist`)
5. Output directory: `frontend/dist`
6. Set environment variable:
   ```
   VITE_API_URL=https://your-railway-service-url
   ```

The `frontend/vercel.json` is already configured — do not change it.

---

## Local Development

```bash
# 1. Clone and install
git clone https://github.com/ESN-Romania-IT/esn-fm.git
cd esn-fm
npm install

# 2. Start local Postgres via Docker
docker compose up -d

# 3. Copy and fill env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit backend/.env: DATABASE_URL, JWT_SECRET are the important ones

# 4. Apply DB schema
npm run db:migrate --workspace=backend

# 5. Start both dev servers (port 3001 + 5173)
npm run dev
```

---

## CI/CD Flow

```
push to dev  →  run-tests-be  →  migrate (DATABASE_URL_DEV)  →  deploy-backend-dev  (Railway Dev)
                                                              →  deploy-frontend     (Vercel preview)

push to main →  run-tests-be  →  migrate (DATABASE_URL_PROD) →  deploy-backend-prod (Railway Prod)
                                                              →  deploy-frontend     (Vercel production)
```

Migrations always run **before** the app deploys so the new schema is ready when the new code starts.

The pre-push Husky hook (`lint → format:check → test → build`) must pass before any push reaches CI.

---

## Database Migrations

Migrations live in `backend/src/db/migrations/` and are numbered sequentially:

```
001_initial_schema.sql
002_add_notifications.sql   ← example next migration
```

**Adding a new migration:**

1. Create `backend/src/db/migrations/NNN_description.sql` where `NNN` is the next three-digit number
2. Write idempotent DDL (use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, etc.)
3. Commit and push — CI picks it up automatically on the next deploy

The migration runner (`backend/src/db/migrate.ts`) tracks applied files in a `schema_migrations` table. Each file runs in its own transaction; a failure rolls back only that file and aborts the process.
