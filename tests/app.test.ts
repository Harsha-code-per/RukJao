import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { CheckResult } from '../shared/schema';
import { createApp } from '../server/app';
import type { Checker } from '../server/checker';
import { clientIp, rateLimit } from '../server/http/rateLimit';
import { Hono } from 'hono';

const RESULT: CheckResult = { verdict: 'scam', risk: 80, tactic: 'otp_theft', urgent: false, flags: [], steps: ['Hang up.'], explanation: 'Scam.', source: 'engine', seenThisWeek: 2 };
const VALID = { message: 'Share your OTP', persona: 'general', channel: 'sms', action: 'none', language: 'en' };

const setup = (check: Checker = vi.fn(() => Promise.resolve(RESULT)), staticRoot?: string) =>
  createApp({ check, ratePerMinute: 3, ...(staticRoot ? { staticRoot } : {}) });

const post = (app: Hono, body: unknown, headers: Record<string, string> = {}) =>
  app.request('/api/check', {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: 'rukjao.test', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('API', () => {
  it('reports health', async () => {
    const res = await setup().request('/api/health');
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('checks a valid request', async () => {
    const res = await post(setup(), VALID);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(RESULT);
  });

  it.each([
    ['an empty message', { ...VALID, message: '   ' }],
    ['an unknown persona', { ...VALID, persona: 'robot' }],
    ['broken JSON', '{"message":'],
  ])('rejects %s with 400', async (_name, body) => {
    const res = await post(setup(), body);
    expect(res.status).toBe(400);
    expect(await res.json()).toHaveProperty('error');
  });

  it('rejects oversized bodies with 413', async () => {
    const res = await post(setup(), { ...VALID, message: 'x'.repeat(9000) });
    expect(res.status).toBe(413);
  });

  it('rejects cross-site requests and accepts same-site ones', async () => {
    expect((await post(setup(), VALID, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await post(setup(), VALID, { origin: 'https://rukjao.test' })).status).toBe(200);
  });

  it('limits each client to the configured rate', async () => {
    const app = setup();
    const statuses = [];
    for (let i = 0; i < 4; i += 1) statuses.push((await post(app, VALID, { 'x-forwarded-for': '9.9.9.9' })).status);
    expect(statuses).toEqual([200, 200, 200, 429]);
    expect((await post(app, VALID, { 'x-forwarded-for': '8.8.8.8' })).status).toBe(200);
  });

  it('returns JSON 404 for unknown API routes and hides internal errors', async () => {
    expect((await setup().request('/api/nope')).status).toBe(404);
    const res = await post(setup(() => Promise.reject(new Error('secret detail'))), VALID);
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret detail');
  });

  it('sends a strict content security policy', async () => {
    const res = await setup().request('/api/health');
    const csp = res.headers.get('content-security-policy') ?? '';
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(res.headers.get('strict-transport-security')).toContain('max-age');
  });
});

describe('static client', () => {
  const root = mkdtempSync(join(tmpdir(), 'rukjao-'));
  mkdirSync(join(root, 'assets'));
  writeFileSync(join(root, 'index.html'), '<h1>shell</h1>');
  writeFileSync(join(root, 'assets', 'app.js'), 'console.log(1)');
  const app = setup(undefined, relative(process.cwd(), root));

  it('serves hashed assets with an immutable cache', async () => {
    const res = await app.request('/assets/app.js');
    expect(res.headers.get('cache-control')).toContain('immutable');
  });

  it('serves the app shell for client routes', async () => {
    expect(await (await app.request('/check')).text()).toContain('shell');
  });
});

describe('rate limiter', () => {
  it('trusts the address Cloud Run appended last', () => {
    expect(clientIp('6.6.6.6, 1.2.3.4')).toBe('1.2.3.4');
    expect(clientIp(undefined)).toBe('local');
  });

  it('opens a new window once the old one ends', async () => {
    let now = 0;
    const app = new Hono().use(rateLimit(1, 1000, () => now)).get('/', (c) => c.text('ok'));
    expect((await app.request('/')).status).toBe(200);
    expect((await app.request('/')).status).toBe(429);
    now = 1000;
    expect((await app.request('/')).status).toBe(200);
  });
});
