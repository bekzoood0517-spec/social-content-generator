import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const windowMinutes = Number(process.env.RATE_LIMIT_WINDOW_MIN) || 10;
const maxRequests = Number(process.env.RATE_LIMIT_MAX) || 20;
const windowMs = windowMinutes * 60 * 1000;

const ipStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipStore.entries()) {
    if (now > record.resetTime) {
      ipStore.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
  const now = Date.now();

  let record = ipStore.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs };
    ipStore.set(ip, record);
  }

  record.count += 1;

  const remaining = Math.max(0, maxRequests - record.count);
  const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);

  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

  if (record.count > maxRequests) {
    res.setHeader('Retry-After', retryAfterSec);
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many requests in a row. Try again in ${retryAfterSec} seconds.`,
      retryAfter: retryAfterSec,
    });
    return;
  }

  next();
}
