/**
 * End-to-end checks in a real browser, desktop and phone: axe WCAG 2.2 AA, zero CSP
 * violations, a keyboard-only check, no horizontal overflow mid-animation, Hindi, and
 * refusal of cross-site API calls.
 *
 * @see TESTING.md
 * @see ACCESSIBILITY.md › Verified
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const audit = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
};

test('landing page has no accessibility violations and no CSP errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ruk jao.');
  await audit(page);
  expect(errors).toEqual([]);
});

/** Collects every Content Security Policy violation the page reports. */
const watchCsp = async (page: Page): Promise<string[]> => {
  const violations: string[] = [];
  await page.exposeFunction('reportCsp', (v: string) => violations.push(v));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      void (window as unknown as { reportCsp: (v: string) => Promise<void> }).reportCsp(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  return violations;
};

test('a scam example gets a scam verdict and a plan, keyboard only', async ({ page }) => {
  const cspViolations = await watchCsp(page);
  await page.goto('/check');
  await page.getByRole('button', { name: 'Fake KYC SMS' }).click();
  await page.getByRole('radio', { name: 'Opened the link' }).check();
  await page.getByRole('button', { name: 'Check this message' }).press('Enter');
  const verdict = page.getByRole('heading', { name: 'This is a scam' });
  await expect(verdict).toBeFocused();
  await expect(page.getByRole('list').filter({ hasText: 'Close that page' })).toBeVisible();
  await expect(page.locator('mark').first()).toBeVisible();
  await audit(page);
  expect(cspViolations).toEqual([]);
});

test('the landing stamp never widens the page, so phones keep their zoom and taps land', async ({ page }) => {
  await page.goto('/check');
  // Record the widest the page gets on every frame while the result stamp animates in.
  await page.evaluate(() => {
    const w = window as Window & { widest?: number };
    w.widest = 0;
    const sample = (): void => {
      w.widest = Math.max(w.widest ?? 0, document.documentElement.scrollWidth);
      requestAnimationFrame(sample);
    };
    sample();
  });
  await page.getByRole('button', { name: '“Digital arrest” call' }).click();
  await page.getByRole('button', { name: 'Check this message' }).click();
  await expect(page.getByRole('heading', { name: 'This is a scam' })).toBeVisible();
  await page.waitForTimeout(600);
  const widest = await page.evaluate(() => (window as Window & { widest?: number }).widest ?? 0);
  expect(widest).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
  await page.getByRole('button', { name: 'Check another message' }).click({ timeout: 5000 });
  await expect(page.getByText('Your verdict and the steps to take will appear here.')).toBeVisible();
});

test('the Hindi example answers in Hindi', async ({ page }) => {
  await page.goto('/check');
  await page.getByRole('button', { name: 'बिजली बिल (Hindi)' }).click();
  await page.getByRole('button', { name: 'Check this message' }).click();
  await expect(page.getByRole('heading', { name: 'यह धोखा है' })).toBeVisible();
  await expect(page.locator('article[lang="hi"]')).toBeVisible();
});

test('cross-site API calls are refused', async ({ request }) => {
  const res = await request.post('/api/check', {
    headers: { origin: 'https://evil.example' },
    data: { message: 'hi', persona: 'general', channel: 'sms', action: 'none', language: 'en' },
  });
  expect(res.status()).toBe(403);
});
