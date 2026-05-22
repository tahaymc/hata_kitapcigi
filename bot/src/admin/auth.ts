import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

/**
 * Constant-time-ish equality check for shared secrets.
 */
const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
};

export const requireSharedToken = (req: Request, res: Response, next: NextFunction) => {
  const expected = config.site.sharedToken;
  if (!expected) {
    return res.status(503).json({ error: 'BOT_SHARED_TOKEN is not configured on the bot.' });
  }

  const provided =
    (req.header('x-bot-token') as string | undefined) ||
    (req.header('authorization') || '').replace(/^Bearer\s+/i, '');

  if (!provided || !safeEqual(provided, expected)) {
    return res.status(401).json({ error: 'Invalid bot token' });
  }

  next();
};
