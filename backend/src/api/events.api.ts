import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { addConnection, removeConnection } from '../lib/sse.js';
import type { JWTPayload } from '../middleware/auth.js';

export function sseConnect(req: Request, res: Response): void {
  const token = req.query.token as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  let payload: JWTPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial heartbeat
  res.write(': connected\n\n');

  addConnection(payload.id, res);

  // Heartbeat every 25 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeConnection(payload.id);
  });
}
