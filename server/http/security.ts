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

/** Rejects API calls whose Origin is another site. Browsers always send Origin on cross-site POSTs. */
export const sameOrigin: MiddlewareHandler = async (c, next) => {
  const origin = c.req.header('origin');
  if (origin !== undefined && new URL(origin).host !== c.req.header('host')) {
    return c.json({ error: 'Cross-site requests are not allowed.' }, HTTP_FORBIDDEN);
  }
  await next();
};
