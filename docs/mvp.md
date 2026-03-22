# MVP — ESN FM (v1)

## Purpose

An internal anonymous Q&A tool for ESN communities. Members can be asked questions anonymously (or by name), answer them publicly, like answers, and follow other members.

---

## In Scope (v1)

### 1. Auth — Registration & Login
- Register with email + password (bcrypt hashed)
- Login returns a signed JWT (stored in `localStorage`)
- Optional: invite-only gate via `INVITE_CODE` env var (checked at register time)
- Token expiry: 7 days

### 2. User Profile
- Fields: `display_name`, `bio`, `avatar_url`, `allow_anonymous_questions` (toggle)
- Public profile page at `/:username` — visible to anyone (no auth required)
- Owner can edit their own profile

### 3. Send a Question
- Any visitor can send a question to a profile owner
- Question is anonymous by default; sender may optionally attach their name
- Max 500 characters
- Question is stored as "unanswered" and hidden until the owner replies

### 4. Inbox (owner only)
- Owner sees all unanswered questions
- Can answer inline (max 1000 chars)
- Can delete without answering (no confirmation needed)
- Answered questions move to the public feed immediately

### 5. Public Profile Feed
- Shows answered Q&A pairs, newest first, paginated (20 per page)
- Each answer has a like button (one like per user per answer)
- Anonymous question sender shown as "Anonymous" or with attached name

---

## Out of Scope (v2+)

- Push / email notifications
- Direct messages between members
- Feed algorithm / discovery page
- Media attachments (images/video)
- Question moderation / reporting
- Mobile app
- Admin panel
- OAuth / social login
- Multi-language support

---

## User Stories

| Role | Story |
|------|-------|
| Visitor | I can view a member's public profile and answered Q&A feed without logging in |
| Visitor | I can send an anonymous question to a member (if they allow it) |
| Member | I can register and log in with email + password |
| Member | I can update my display name, bio, avatar, and toggle anonymous questions |
| Member | I can see all unanswered questions in my inbox |
| Member | I can answer a question, making it visible on my public profile |
| Member | I can delete an unanswered question |
| Member | I can like an answer once |
| Member | I can follow and unfollow other members |

---

## Acceptance Criteria (must pass before v1 release)

- [ ] Register → login → receive JWT
- [ ] JWT is required for inbox, answering, liking, following, profile edit
- [ ] Anonymous questions do not expose the sender's identity unless the sender opts in
- [ ] `allow_anonymous_questions = false` returns 403 on question submission
- [ ] Pagination works on the public feed (cursor or offset)
- [ ] Likes are idempotent (liking twice does not increment count)
- [ ] All API inputs validated with zod; invalid input returns 400 with error details
- [ ] Passwords are never returned from any API endpoint