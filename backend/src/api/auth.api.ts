import { randomBytes } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      [data.email, data.username, hash, data.display_name]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    res.status(201).json({ token, user });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === '23505') {
      res.status(409).json({ error: 'Email or username already taken' });
      return;
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);

    const result = await pool.query(
      `SELECT id, email, username, display_name, bio, avatar_url, allow_anonymous_questions, role, password_hash
       FROM users WHERE email = $1`,
      [data.email]
    );

    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const { password_hash: _, ...safeUser } = user;
    const token = jwt.sign(
      { id: safeUser.id, username: safeUser.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const userResult = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)`,
      [email]
    );
    // Always respond ok to prevent email enumeration
    if (!userResult.rows[0]) {
      res.json({ ok: true });
      return;
    }

    const userId = userResult.rows[0].id;
    // Generate a secure random token
    const token = randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, token]
    );

    const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/reset-password?token=${token}`;
    const resendKey = process.env.RESEND_API_KEY;

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#131313;font-family:system-ui,-apple-system,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#131313;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

        <!-- Logo / Brand -->
        <tr><td align="center" style="padding-bottom:32px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:8px;vertical-align:middle;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E2E1DF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </td>
              <td style="color:#E2E1DF;font-size:18px;font-weight:700;letter-spacing:-0.3px;vertical-align:middle;">ESN FM</td>
            </tr>
          </table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background-color:#1A1A1A;border:1px solid #2E2E2E;border-radius:8px;padding:36px 32px;">

          <!-- Heading -->
          <p style="margin:0 0 8px;color:#E2E1DF;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Reset your password</p>
          <p style="margin:0 0 28px;color:#8a8980;font-size:14px;line-height:1.5;">
            We received a request to reset the password for your ESN FM account. Click the button below — this link expires in <strong style="color:#E2E1DF;">1 hour</strong>.
          </p>

          <!-- Button -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background-color:#E2E1DF;border-radius:6px;">
                <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;color:#131313;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">
                  Reset password
                </a>
              </td>
            </tr>
          </table>

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td style="border-top:1px solid #2E2E2E;"></td></tr>
          </table>

          <!-- Fallback link -->
          <p style="margin:0 0 6px;color:#8a8980;font-size:12px;">If the button doesn't work, copy this link into your browser:</p>
          <p style="margin:0;word-break:break-all;">
            <a href="${resetUrl}" style="color:#E2E1DF;font-size:12px;text-decoration:underline;">${resetUrl}</a>
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;color:#8a8980;font-size:12px;line-height:1.6;">
            If you didn't request a password reset, you can safely ignore this email.<br>
            Your password won't change until you click the link above.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? 'ESN FM <noreply@esnfm.app>',
          to: email,
          subject: 'Reset your ESN FM password',
          html: emailHtml,
        }),
      });
    } else {
      console.log(`[forgot-password] Reset URL for ${email}: ${resetUrl}`);
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password || password.length < 8) {
      res.status(400).json({ error: 'Token and password (min 8 chars) are required' });
      return;
    }

    const tokenResult = await pool.query(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );

    if (!tokenResult.rows[0]) {
      res.status(400).json({ error: 'Invalid or expired reset link' });
      return;
    }

    const { id: tokenId, user_id: userId } = tokenResult.rows[0];
    const hash = await bcrypt.hash(password, 12);

    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, userId]);
    await pool.query(`UPDATE password_reset_tokens SET used = TRUE WHERE id = $1`, [tokenId]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
