import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';

export async function verifyAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const result = await pool.query(`SELECT role FROM users WHERE id = $1`, [req.user.id]);
  const role = result.rows[0]?.role;
  if (role !== 'admin' && role !== 'moderator') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}

export async function verifyAdminOnly(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const result = await pool.query(`SELECT role FROM users WHERE id = $1`, [req.user.id]);
  const role = result.rows[0]?.role;
  if (role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}
