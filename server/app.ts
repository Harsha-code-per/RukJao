import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { compress } from 'hono/compress';
import { checkRequestSchema } from '../shared/schema';
import type { Checker } from './checker';
import { rateLimit } from './http/rateLimit';
import { sameOrigin, securityHeaders } from './http/security';

const BODY_LIMIT_BYTES = 8 * 1024;
const MINUTE_MS = 60_000;
const HTTP = { badRequest: 400, notFound: 404, tooLarge: 413, serverError: 500 } as const;
const IMMUTABLE = 'public, max-age=31536000, immutable';

export interface AppDeps {
  check: Checker;
  ratePerMinute: number;
  /** Folder with the built client. Omitted in API-only tests. */
  staticRoot?: string;
}

const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const mountClient = (app: Hono, root: string): void => {
  app.use('/assets/*', async (c, next) => {
    await next();
    c.header('Cache-Control', IMMUTABLE);
  });
  app.use('*', serveStatic({ root }));
  // Single-page app: unknown paths get the shell, which routes on the client.
  app.get('*', serveStatic({ root, path: 'index.html' }));
};

/** The whole HTTP surface: security headers, the check API, health, and the built client. */
export const createApp = ({ check, ratePerMinute, staticRoot }: AppDeps): Hono => {
  const app = new Hono();
  app.use(securityHeaders, compress());
  app.get('/healthz', (c) => c.json({ status: 'ok' }));
  app.post(
    '/api/check',
    sameOrigin,
    bodyLimit({ maxSize: BODY_LIMIT_BYTES, onError: (c) => c.json({ error: 'Message is too long.' }, HTTP.tooLarge) }),
    rateLimit(ratePerMinute, MINUTE_MS),
    async (c) => {
      const parsed = checkRequestSchema.safeParse(await readJson(c.req.raw));
      if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, HTTP.badRequest);
      return c.json(await check(parsed.data));
    },
  );
  app.all('/api/*', (c) => c.json({ error: 'Not found.' }, HTTP.notFound));
  if (staticRoot !== undefined) mountClient(app, staticRoot);
  app.onError((error, c) => {
    console.error('Unhandled error', error.message);
    return c.json({ error: 'Something went wrong. Please try again.' }, HTTP.serverError);
  });
  return app;
};
