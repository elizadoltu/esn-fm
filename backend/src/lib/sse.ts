import type { Response } from 'express';

// userId → SSE response
const connections = new Map<string, Response>();

export function addConnection(userId: string, res: Response): void {
  connections.set(userId, res);
}

export function removeConnection(userId: string): void {
  connections.delete(userId);
}

export function sendSSE(userId: string, event: string, data: unknown): void {
  const res = connections.get(userId);
  if (!res) return;
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch {
    connections.delete(userId);
  }
}
