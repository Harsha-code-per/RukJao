/**
 * Browser-facing protection: security headers on every response and a same-origin
 * guard on the API.
 *
 * The CSP admits only this origin, with no inline code, third parties or framing. That
 * is why fonts are self-hosted and zod runs jitless (`shared/schema.ts`). Both
 * middlewares are mounted in `server/app.ts`, and the headers are asserted in
 * `tests/app.test.ts`.
 *
 * @see SECURITY.md › Browser
 */

import type { MiddlewareHandler } from 'hono';
import { secureHeaders } from 'hono/secure-headers';

/** Strict CSP: only our own scripts, styles, fonts and API. No inline code, no third parties, no framing. */
export const securityHeaders = secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", 'data:'],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: [],
  },
  strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: { camera: [], microphone: [], geolocation: [], payment: [] },
  crossOriginEmbedderPolicy: false,
});

const HTTP_FORBIDDEN = 403;

const hostOf = (origin: string): string | null => URL.parse(origin)?.host ?? null;

/** Rejects API calls whose Origin is another site, or unreadable. Browsers always send Origin on cross-site POSTs. */
export const sameOrigin: MiddlewareHandler = async (c, next) => {
  const origin = c.req.header('origin');
  if (origin !== undefined && hostOf(origin) !== c.req.header('host')) {
    return c.json({ error: 'Cross-site requests are not allowed.' }, HTTP_FORBIDDEN);
  }
  await next();
};
