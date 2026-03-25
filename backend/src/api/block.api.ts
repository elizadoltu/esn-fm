import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';

export async function blockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const target = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!target.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const targetId = target.rows[0].id;
    if (targetId === req.user!.id) {
      res.status(400).json({ error: 'Cannot block yourself' });
      return;
    }

    await pool.query(
      `INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.user!.id, targetId]
    );

    // Also remove follow relationships in both directions
    await pool.query(
      `DELETE FROM follows WHERE (follower_id = $1 AND following_id = $2) OR (follower_id = $2 AND following_id = $1)`,
      [req.user!.id, targetId]
    );

    res.json({ blocked: true });
  } catch (err) {
    next(err);
  }
}

export async function unblockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const target = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!target.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    await pool.query(`DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2`, [
      req.user!.id,
      target.rows[0].id,
    ]);
    res.json({ blocked: false });
  } catch (err) {
    next(err);
  }
}

export async function getBlockedUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, b.created_at AS blocked_at
       FROM blocks b
       JOIN users u ON u.id = b.blocked_id
       WHERE b.blocker_id = $1
       ORDER BY b.created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}
