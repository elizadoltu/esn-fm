# Architecture — ESN FM

## System Overview

```
Browser (React SPA)
  │  REST/JSON over HTTPS
  ▼
Express API (Node.js + TypeScript)  ←──  Railway service
  │  pg driver
  ▼
PostgreSQL 15+  ←──────────────────────  Railway Postgres plugin
```

Frontend is deployed on **Vercel** (static SPA, all routing handled client-side).
Backend + database are deployed on **Railway** (two separate services: `esn-fm-api` and a managed Postgres plugin).

---

## Backend API Routes

Base path: `/api`

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | public | Create account (email, password, display_name) |
| POST | `/auth/login` | public | Return signed JWT |

### Users — `/api/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/:username` | public | Get public profile |
| PATCH | `/users/me` | required | Update own profile |

### Questions — `/api/questions`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/questions` | public | Send a question to a user |
| GET | `/questions/inbox` | required | Get own unanswered questions |
| DELETE | `/questions/:id` | required (owner) | Delete a question |

### Answers — `/api/answers`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/answers` | required | Answer a question (moves it to public feed) |
| GET | `/answers/:username` | public | Paginated feed for a profile |
| DELETE | `/answers/:id` | required (owner) | Delete an answer |
| POST | `/answers/:id/like` | required | Toggle like on an answer |

### Follows — `/api/follows`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/follows/:username` | required | Follow a user |
| DELETE | `/follows/:username` | required | Unfollow a user |
| GET | `/follows/:username/followers` | public | List followers |
| GET | `/follows/:username/following` | public | List following |

---

## Backend Folder Structure

```
backend/src/
├── db/
│   ├── pool.ts          # pg Pool singleton (reads DATABASE_URL)
│   └── schema.sql       # DDL — run once to set up tables
├── middleware/
│   ├── auth.ts          # verifyJWT — attaches req.user
│   └── errorHandler.ts  # global Express error handler
├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── question.routes.ts
│   ├── answer.routes.ts
│   └── follow.routes.ts
├── validators/
│   ├── auth.validator.ts
│   ├── user.validator.ts
│   ├── question.validator.ts
│   └── answer.validator.ts
├── docs/
│   └── swagger.ts       # Scalar/OpenAPI spec (already set up)
└── index.ts             # Express app bootstrap
```

---

## Frontend Folder Structure

```
frontend/src/
├── api/
│   ├── client.ts        # Axios instance (base URL from VITE_API_URL)
│   ├── auth.api.ts      # login, register calls
│   ├── questions.api.ts
│   ├── answers.api.ts
│   └── follows.api.ts
├── hooks/               # TanStack Query hooks (useProfile, useInbox, etc.)
├── components/          # Shared UI (shadcn/ui wrappers, layout, nav)
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ProfilePage.tsx  # /:username — public feed
│   ├── InboxPage.tsx    # /inbox — owner only
│   └── AskPage.tsx      # /ask/:username — send question form
├── lib/
│   └── auth.ts          # JWT store (localStorage helpers)
├── App.tsx              # React Router setup
└── main.tsx
```

---

## Auth Flow

1. User registers/logs in → backend returns `{ token, user }`
2. Frontend stores JWT in `localStorage` under key `esn_fm_token`
3. Axios client reads token and attaches `Authorization: Bearer <token>` to every request
4. Backend `auth` middleware verifies the token and attaches `req.user = { id, username }`
5. Protected routes return 401 if no/invalid token

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://user:password@localhost:5432/esnfm
JWT_SECRET=change_me_in_production
PORT=3001
NODE_ENV=development
INVITE_CODE=        # optional — leave empty to allow open registration
API_URL=http://localhost:3001
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:3001
```

---

## Local Dev — Docker Compose

`docker-compose.yml` at repo root spins up only Postgres (the Node server runs via `tsx watch`):

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: esnfm
      POSTGRES_PASSWORD: esnfm
      POSTGRES_DB: esnfm
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

---

## Deployment

### Railway (backend)
- Root `railway.json` points to the monorepo root build command (`npm install && npm run build:backend`)
- `backend/railway.json` handles the backend service specifically
- Secrets needed: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `API_URL`

### Vercel (frontend)
- Build command: `npm run build --workspace frontend`
- Output dir: `frontend/dist`
- Root dir: `.` (monorepo root)
- Secrets needed: `VITE_API_URL` (set as env var in Vercel project settings)

### GitHub Actions Secrets Required
See [`docs/deployment.md`](deployment.md) for the full list.