import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, username, display_name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               username: { type: string }
 *               display_name: { type: string }
 *               invite_code: { type: string }
 *     responses:
 *       201:
 *         description: Account created, returns token and user
 *       400:
 *         description: Validation error
 *       403:
 *         description: Invalid invite code
 *       409:
 *         description: Email or username already taken
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const inviteCode = process.env.INVITE_CODE;
    if (inviteCode && data.invite_code !== inviteCode) {
      res.status(403).json({ error: 'Invalid invite code' });
      return;
    }

    const hash = await bcrypt.hash(data.password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, display_name, bio, avatar_url, allow_anonymous_questions, created_at`,
      [data.email, data.username, hash, data.display_name],
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    res.status(201).json({ token, user });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === '23505') {
      res.status(409).json({ error: 'Email or username already taken' });
      return;
    }
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Returns token and user
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const result = await pool.query(
      `SELECT id, email, username, display_name, bio, avatar_url, allow_anonymous_questions, password_hash
       FROM users WHERE email = $1`,
      [data.email],
    );

    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const { password_hash: _omit, ...safeUser } = user;
    const token = jwt.sign(
      { id: safeUser.id, username: safeUser.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

export default router;
