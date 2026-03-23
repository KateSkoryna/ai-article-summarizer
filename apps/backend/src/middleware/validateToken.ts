import { Request, Response, NextFunction } from 'express';

export function validateToken(req: Request, res: Response, next: NextFunction) {
  const token = process.env.EXTENSION_TOKEN;
  if (!token) return next();
  if (req.headers['x-extension-token'] !== token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
