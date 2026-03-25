import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { createNotification } from '../db/notifications.js';

export async function getFollowRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function approveFollowRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requester = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!requester.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const requesterId = requester.rows[0].id;

    const updated = await pool.query(
      `UPDATE follows SET status = 'accepted'
       WHERE follower_id = $1 AND following_id = $2 AND status = 'pending'
       RETURNING follower_id`,
      [requesterId, req.user!.id]
    );

    if (!updated.rows[0]) {
      res.status(404).json({ error: 'No pending request found' });
      return;
    }

    // Notify the requester that their request was accepted
    await createNotification(requesterId, 'new_follower', req.user!.id, req.user!.id);

    res.json({ approved: true });
  } catch (err) {
    next(err);
  }
}

export async function declineFollowRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requester = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!requester.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await pool.query(
      `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2 AND status = 'pending'`,
      [requester.rows[0].id, req.user!.id]
    );

    res.json({ declined: true });
  } catch (err) {
    next(err);
  }
}

export async function followUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const target = await pool.query(`SELECT id, is_private FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!target.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const targetId = target.rows[0].id;
    const isPrivate: boolean = target.rows[0].is_private;
    const status = isPrivate ? 'pending' : 'accepted';

    const inserted = await pool.query(
      `INSERT INTO follows (follower_id, following_id, status) VALUES ($1, $2, $3)
       ON CONFLICT (follower_id, following_id) DO NOTHING
       RETURNING follower_id`,
      [req.user!.id, targetId, status]
    );

    if (inserted.rows[0]) {
      if (isPrivate) {
        await createNotification(targetId, 'follow_request', req.user!.id, req.user!.id);
      } else {
        await createNotification(targetId, 'new_follower', req.user!.id, req.user!.id);
      }
    }

    res.json({ following: !isPrivate, pending: isPrivate && !!inserted.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function unfollowUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const target = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!target.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await pool.query(`DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`, [
      req.user!.id,
      target.rows[0].id,
    ]);

    res.json({ following: false, pending: false });
  } catch (err) {
    next(err);
  }
}

export async function getFollowers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const target = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!target.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = $1 AND f.status = 'accepted'
       ORDER BY f.created_at DESC`,
      [target.rows[0].id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getFollowing(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const target = await pool.query(`SELECT id FROM users WHERE username = $1`, [
      req.params.username,
    ]);
    if (!target.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url
       FROM follows f
       JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = $1 AND f.status = 'accepted'
       ORDER BY f.created_at DESC`,
      [target.rows[0].id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}
