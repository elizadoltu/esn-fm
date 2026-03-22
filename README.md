# ESN FM — Anonymous Q&A Community Tool

An internal anonymous Q&A platform for ESN communities. Members can send each other anonymous (or named) questions, answer them publicly, like answers, and follow other members.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, React Router v7, Axios |
| Backend | Node.js + TypeScript, Express 5, pg (PostgreSQL driver), bcrypt, jsonwebtoken, zod, helmet, cors |
| Database | PostgreSQL 15+ — 5 tables: `users`, `questions`, `answers`, `likes`, `follows` |
| Deployment | Railway (backend + DB) · Vercel (frontend) · GitHub Actions (CI/CD) |

---

## Project Structure

```
esn-fm/
├── backend/               # Express + TypeScript API
│   ├── src/
│   │   ├── db/            # PostgreSQL pool + schema migrations
│   │   ├── middleware/    # auth (JWT), error handler
│   │   ├── routes/        # /auth, /users, /questions, /answers, /follows
│   │   ├── validators/    # zod schemas per route group
│   │   └── index.ts       # app entrypoint
│   ├── .env.example
│   └── package.json
├── frontend/              # React + Vite SPA
│   ├── src/
│   │   ├── api/           # Axios client + TanStack Query hooks
│   │   ├── components/    # shared UI components
│   │   ├── pages/         # Profile, Inbox, Ask, Login, Register
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
├── docs/                  # Architecture, MVP, DB schema, agent rules
├── .github/workflows/     # CI/CD — Railway + Vercel
├── docker-compose.yml     # Local dev: Postgres only
└── package.json           # Monorepo root with workspace scripts
```

---

## Monorepo Scripts (run from root)

```bash
npm run dev              # Start frontend + backend concurrently
npm run dev:frontend     # Frontend only (port 5173)
npm run dev:backend      # Backend only (port 3001)
npm run build            # Build frontend
npm run build:backend    # Compile backend TypeScript
npm run lint             # Lint frontend
npm run lint:backend     # Lint backend
npm run test:run         # Run frontend tests
npm run test:run:backend # Run backend tests
```

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- Docker (for local Postgres)

### Steps

```bash
# 1. Clone and install
git clone https://github.com/ESN-Romania-IT/esn-hr-app.git
cd esn-fm
npm install

# 2. Start local Postgres via Docker
docker compose up -d

# 3. Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. Run database migrations
cd backend && npm run db:migrate

# 5. Start dev servers
cd .. && npm run dev
```

API runs at `http://localhost:3001` — Scalar docs at `http://localhost:3001/docs`
Frontend runs at `http://localhost:5173`

---

## Deployment

- **Backend + Database** → Railway (two services: app + Postgres plugin)
- **Frontend** → Vercel

CI/CD is handled by GitHub Actions. Add the required secrets to your GitHub repo environments (`development`, `production`) before the workflows will work. See [`docs/deployment.md`](docs/deployment.md) for the full list of secrets.

---

## Documentation

| File | Contents |
|------|---------|
| [`docs/mvp.md`](docs/mvp.md) | MVP feature scope, user stories, what's out of v1 |
| [`docs/architecture.md`](docs/architecture.md) | System design, API routes, folder conventions |
| [`docs/database.md`](docs/database.md) | PostgreSQL schema (DDL) |
| [`docs/agent-rules.md`](docs/agent-rules.md) | Coding conventions and agent implementation guide |