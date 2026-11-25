import type { MiddlewareHandler } from 'hono';

const MAX_TRACKED = 10_000;
const HTTP_TOO_MANY = 429;
const SECOND_MS = 1000;

interface Window {
  start: number;
  count: number;
}

/** The client address Cloud Run's front end appended last; earlier entries can be forged. */
export const clientIp = (forwardedFor: string | undefined): string =>
  forwardedFor?.split(',').at(-1)?.trim() ?? 'local';

/**
 * Fixed-window limiter per client address.
 * ponytail: in-memory, correct because the service runs one instance; move to Firestore or Redis if it scales out.
 */
export const rateLimit = (limit: number, windowMs: number, now: () => number = Date.now): MiddlewareHandler => {
  const windows = new Map<string, Window>();
  return async (c, next) => {
    const ip = clientIp(c.req.header('x-forwarded-for'));
    const time = now();
    const current = windows.get(ip);
    const window = current && time - current.start < windowMs ? current : { start: time, count: 0 };
    window.count += 1;
    if (windows.size >= MAX_TRACKED) windows.clear();
    windows.set(ip, window);
    if (window.count > limit) {
      c.header('Retry-After', String(Math.ceil((window.start + windowMs - time) / SECOND_MS)));
      return c.json({ error: 'Too many checks. Please wait a minute and try again.' }, HTTP_TOO_MANY);
    }
    await next();
  };
};
