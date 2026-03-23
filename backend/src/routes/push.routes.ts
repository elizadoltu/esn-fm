import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();

/** Save or update a push subscription for the current user's device. */
router.post('/subscribe', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint, keys } = req.body as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: 'Invalid push subscription object' });
      return;
    }

    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = $1`,
      [req.user!.id, endpoint, keys.p256dh, keys.auth]
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** Remove a push subscription (called when user disables notifications). */
router.delete('/subscribe', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint } = req.body as { endpoint?: string };

    if (endpoint) {
      await pool.query(`DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`, [
        req.user!.id,
        endpoint,
      ]);
    } else {
      // Remove all subscriptions for this user
      await pool.query(`DELETE FROM push_subscriptions WHERE user_id = $1`, [req.user!.id]);
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
