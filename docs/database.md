# Database Schema — ESN FM

PostgreSQL 15+. All tables use `UUID` primary keys and `TIMESTAMPTZ` timestamps.

---

## DDL (copy into `backend/src/db/schema.sql`)

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   TEXT UNIQUE NOT NULL,
  username                TEXT UNIQUE NOT NULL,          -- used in profile URL: /:username
  password_hash           TEXT NOT NULL,
  display_name            TEXT NOT NULL,
  bio                     TEXT DEFAULT '',
  avatar_url              TEXT DEFAULT '',
  allow_anonymous_questions BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- QUESTIONS
-- ─────────────────────────────────────────────
CREATE TABLE questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL = anonymous
  sender_name     TEXT,                                          -- optional display name from sender
  content         TEXT NOT NULL CHECK (char_length(content) <= 500),
  is_answered     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX questions_recipient_idx ON questions(recipient_id);
CREATE INDEX questions_answered_idx  ON questions(recipient_id, is_answered);

-- ─────────────────────────────────────────────
-- ANSWERS
-- ─────────────────────────────────────────────
CREATE TABLE answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID UNIQUE NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX answers_author_idx ON answers(author_id);

-- ─────────────────────────────────────────────
-- LIKES  (one per user per answer)
-- ─────────────────────────────────────────────
CREATE TABLE likes (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, answer_id)   -- composite PK prevents duplicate likes
);

-- ─────────────────────────────────────────────
-- FOLLOWS
-- ─────────────────────────────────────────────
CREATE TABLE follows (
  follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)  -- cannot follow yourself
);
```

---

## Key Relationships

```
users ──< questions (recipient_id)   one user receives many questions
users ──< questions (sender_id)      one user sends many questions (nullable = anon)
questions ──< answers (question_id)  one question has at most one answer (UNIQUE)
answers ──< likes (answer_id)        one answer has many likes
users ──< likes (user_id)            one user likes many answers
users ──< follows (follower_id)
users ──< follows (following_id)
```

---

## Public Feed Query

Returns paginated answered Q&A pairs for a profile, with like counts:

```sql
SELECT
  q.id            AS question_id,
  q.content       AS question,
  q.sender_name,
  q.created_at    AS asked_at,
  a.id            AS answer_id,
  a.content       AS answer,
  a.created_at    AS answered_at,
  COUNT(l.answer_id) AS likes,
  -- if viewer is logged in, pass $3 as their user_id, else NULL
  BOOL_OR(l.user_id = $3) AS liked_by_me
FROM questions q
JOIN answers   a ON a.question_id = q.id
JOIN users     u ON u.id = q.recipient_id
LEFT JOIN likes l ON l.answer_id = a.id
WHERE u.username = $1
GROUP BY q.id, q.content, q.sender_name, q.created_at,
         a.id, a.content, a.created_at
ORDER BY a.created_at DESC
LIMIT 20 OFFSET $2;
```

---

## Migrations Strategy (v1)

No migration framework in v1. Keep the full schema in `backend/src/db/schema.sql` and add a script:

```ts
// backend/src/db/migrate.ts
import { pool } from './pool.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

await pool.query(sql);
console.log('Schema applied.');
await pool.end();
```

Add to `backend/package.json` scripts:
```json
"db:migrate": "tsx src/db/migrate.ts"
```