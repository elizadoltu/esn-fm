# Agent Rules — ESN FM

This file is the authoritative guide for any AI agent (or developer) implementing features in this repo. Read this before touching any code.

---

## What Already Exists (do not re-create)

| Thing | Location | Notes |
|-------|----------|-------|
| Express app bootstrap | `backend/src/index.ts` | Already has CORS, JSON body parser, Scalar docs |
| Swagger/Scalar docs setup | `backend/src/docs/swagger.ts` | Scans route files for `@openapi` JSDoc |
| Monorepo workspace scripts | `package.json` (root) | `dev`, `build`, `lint`, `test` for both workspaces |
| CI/CD workflows | `.github/workflows/` | Railway (dev + prod) + Vercel + PR validation + BE tests |
| Pre-push hook | `.husky/pre-push` | Runs lint, format check, tests, build for both workspaces |
| Railway config | `railway.json` + `backend/railway.json` | Do not change — owner configures secrets |
| Vercel config | `frontend/vercel.json` | Do not change — owner configures secrets |

---

## Backend Rules

### 1. Every new route file follows this pattern
```ts
// backend/src/routes/example.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { exampleSchema } from '../validators/example.validator.js';

const router = Router();

router.post('/', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = exampleSchema.parse(req.body);   // zod — throws on invalid input
    // ... handler logic ...
    res.status(201).json({ ... });
  } catch (err) {
    next(err);   // always forward to global error handler
  }
});

export default router;
```

### 2. Register every new router in `index.ts`
```ts
import exampleRoutes from './routes/example.routes.js';
app.use('/api/example', exampleRoutes);
```

### 3. Validation is always zod, always in a `validators/` file
- Define and export a zod schema for every request body / query string
- Call `.parse()` inside the route handler (throws `ZodError` on failure)
- The global error handler converts `ZodError` → 400 with details

### 4. Auth middleware
- `verifyJWT` is the only auth middleware; it attaches `req.user = { id: UUID, username: string }`
- Add it as the second argument to any protected route handler
- Never do manual JWT verification inside a route handler

### 5. Database access
- Import `pool` from `../db/pool.js` — never create a new Pool inside a route
- Use parameterized queries only: `pool.query('SELECT * FROM users WHERE id = $1', [id])`
- Never interpolate user input into SQL strings

### 6. Passwords
- Hash with `bcrypt` (salt rounds: 12) at registration time
- Never return `password_hash` from any query — always `SELECT id, email, username, display_name, ...` explicitly (never `SELECT *` on users)

### 7. JWT
- Sign with `process.env.JWT_SECRET` — throw a startup error if this env var is missing
- Payload: `{ id: string, username: string }`
- Expiry: `'7d'`

### 8. Error responses
All errors follow this shape:
```json
{ "error": "Human readable message", "details": [...] }
```
- `details` is present only for validation errors (zod issues array)

### 9. OpenAPI docs
Add a `@openapi` JSDoc block to every route so Scalar picks it up automatically. Minimal example:
```ts
/**
 * @openapi
 * /api/example:
 *   post:
 *     summary: Create example
 *     tags: [Example]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
```

---

## Frontend Rules

### 1. API calls live in `src/api/`
- One file per resource group: `auth.api.ts`, `questions.api.ts`, etc.
- Each file exports plain async functions that call the Axios client
- Never call `axios` directly in a component or hook — always go through `src/api/client.ts`

### 2. The Axios client (`src/api/client.ts`)
```ts
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('esn_fm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
```

### 3. Data fetching is always TanStack Query
- Use `useQuery` for GET requests, `useMutation` for POST/PATCH/DELETE
- Query keys follow the pattern `['resource', identifier]` e.g. `['profile', username]`
- Put hooks in `src/hooks/` — one file per resource group

### 4. Routing (React Router v7)
- All routes declared in `App.tsx`
- Protected routes check for JWT in localStorage and redirect to `/login` if absent
- Route structure:
  - `/login` — LoginPage
  - `/register` — RegisterPage
  - `/:username` — ProfilePage (public)
  - `/inbox` — InboxPage (protected)
  - `/ask/:username` — AskPage (public)

### 5. UI components
- Use shadcn/ui components wherever possible — do not write raw Tailwind for common patterns (buttons, inputs, cards, dialogs)
- Custom components go in `src/components/`
- Page-level components go in `src/pages/`

### 6. Environment variables
- Backend URL: `import.meta.env.VITE_API_URL`
- Never hardcode `localhost:3001`

---

## What Needs to Be Built (implementation checklist)

### Backend (not yet implemented)
- [ ] `backend/src/db/pool.ts` — pg Pool singleton
- [ ] `backend/src/db/schema.sql` — DDL (see `docs/database.md`)
- [ ] `backend/src/db/migrate.ts` — script to apply schema
- [ ] `backend/src/middleware/auth.ts` — JWT verification middleware
- [ ] `backend/src/middleware/errorHandler.ts` — global error handler (ZodError → 400)
- [ ] `backend/src/validators/*.ts` — zod schemas for all routes
- [ ] `backend/src/routes/auth.routes.ts` — register + login
- [ ] `backend/src/routes/question.routes.ts` — send, inbox, delete
- [ ] `backend/src/routes/answer.routes.ts` — post, feed, delete, like toggle
- [ ] `backend/src/routes/follow.routes.ts` — follow, unfollow, list
- [ ] Update `backend/src/routes/user.routes.ts` — get profile, update own profile
- [ ] Update `backend/src/index.ts` — register all new routes, add helmet, add errorHandler
- [ ] Update `backend/package.json` — add `pg`, `bcrypt`, `jsonwebtoken`, `zod`, `helmet` + their `@types`
- [ ] `backend/.env.example`
- [ ] `docker-compose.yml` (repo root)

### Frontend (not yet implemented)
- [ ] Install shadcn/ui, TanStack Query, Axios
- [ ] `frontend/src/api/client.ts` — Axios instance with JWT interceptor
- [ ] `frontend/src/api/*.ts` — API functions per resource
- [ ] `frontend/src/hooks/*.ts` — TanStack Query hooks
- [ ] `frontend/src/lib/auth.ts` — JWT localStorage helpers
- [ ] `frontend/src/pages/LoginPage.tsx`
- [ ] `frontend/src/pages/RegisterPage.tsx`
- [ ] `frontend/src/pages/ProfilePage.tsx` — public feed + ask button
- [ ] `frontend/src/pages/InboxPage.tsx` — unanswered questions list
- [ ] `frontend/src/pages/AskPage.tsx` — question submission form
- [ ] `frontend/src/App.tsx` — React Router v7 setup with protected routes
- [ ] `frontend/.env.example`

---

## Dependency Versions to Use

| Package | Reason |
|---------|--------|
| `pg` + `@types/pg` | PostgreSQL driver |
| `bcrypt` + `@types/bcrypt` | Password hashing (12 salt rounds) |
| `jsonwebtoken` + `@types/jsonwebtoken` | JWT signing/verifying |
| `zod` | Input validation (backend) |
| `helmet` | Security headers |
| `@tanstack/react-query` | Data fetching (frontend) |
| `axios` | HTTP client (frontend) |
| `shadcn/ui` | Component library (frontend, install via CLI) |

All other dependencies are already installed and should not be changed.

---

## PR / Commit Conventions

- PR titles must match `HRA-\d+` (enforced by `pr-validation.yml`)
- Commits should be descriptive and scoped, e.g. `feat(auth): add JWT middleware`
- Never skip the pre-push hook (`--no-verify`)