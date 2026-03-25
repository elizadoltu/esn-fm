import { Router } from 'express';
import { register, login, forgotPassword, resetPassword } from '../api/auth.api.js';

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
router.post('/register', register);

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
router.post('/login', login);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

export default router;
