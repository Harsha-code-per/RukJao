import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CheckResult } from '../shared/schema';
import { App } from '../src/App';
import { segment } from '../src/check/Highlight';
import { shareWarning, warningText } from '../src/check/share';
import { Landing } from '../src/landing/Landing';
import { postCheck } from '../src/lib/api';
import { navigate } from '../src/lib/route';

const RESULT: CheckResult = {
  verdict: 'scam',
  risk: 85,
  tactic: 'digital_arrest',
  urgent: true,
  flags: [{ id: 'digital_arrest', label: 'Threatens arrest', start: 0, end: 3 }],
  steps: ['Call 1930 now.', 'Hang up.'],
  explanation: 'Police never arrest on video calls.',
  source: 'ai',
  seenThisWeek: 4,
};

const mockMatchMedia = (reduce: boolean) => {
  window.matchMedia = vi.fn(() => ({ matches: reduce }) as MediaQueryList);
};

const respond = (body: unknown, status = 200) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

beforeEach(() => {
  mockMatchMedia(true);
  window.scrollTo = vi.fn();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('highlighting', () => {
  it('merges overlapping flags and keeps the text intact', () => {
    const parts = segment('pay fee now', [
      { id: 'a', label: 'A', start: 0, end: 7 },
      { id: 'b', label: 'B', start: 4, end: 7 },
    ]);
    expect(parts).toEqual([{ text: 'pay fee', labels: ['A', 'B'] }, { text: ' now', labels: [] }]);
    expect(segment('hi', [])).toEqual([{ text: 'hi', labels: [] }]);
    expect(segment('ab', [{ id: 'x', label: 'X', start: 1, end: 2 }]).map((p) => p.text)).toEqual(['a', 'b']);
  });
});

describe('landing', () => {
  it('shows the promise, the steps and the helpline', () => {
    render(<Landing />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ruk jao.');
    expect(screen.getAllByRole('link', { name: /1930/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('stops the inbox stream after a moment', () => {
    mockMatchMedia(false);
    vi.useFakeTimers();
    render(<Landing />);
    const inbox = screen.getByRole('img');
    expect(inbox).toHaveAttribute('data-frozen', 'false');
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(inbox).toHaveAttribute('data-frozen', 'true');
  });
});

describe('checker flow', () => {
  it('routes to the checker, shows the verdict and focuses it', async () => {
    const fetchSpy = respond(RESULT);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole('link', { name: 'Check a message' })[0] as HTMLElement);
    await user.type(await screen.findByLabelText(/paste the message/i), 'CBI here, digital arrest');
    await user.click(screen.getByRole('radio', { name: 'Paid or sent money' }));
    await user.click(screen.getByRole('button', { name: 'Check this message' }));
    const verdict = await screen.findByRole('heading', { name: 'This is a scam' });
    expect(verdict).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Act now: call 1930' })).toBeInTheDocument();
    expect(screen.getByText(/4 times/)).toBeInTheDocument();
    const sent = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body)) as { action: string };
    expect(sent.action).toBe('paid');
  });

  it('asks for a message instead of sending an empty one', async () => {
    const fetchSpy = respond(RESULT);
    window.history.replaceState(null, '', '/check');
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Check this message' }));
    expect(screen.getByLabelText(/paste the message/i)).toHaveAttribute('aria-invalid', 'true');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fills an example, shows server errors, and resets', async () => {
    window.history.replaceState(null, '', '/check');
    respond({ error: 'Too many checks.' }, 429);
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'बिजली बिल (Hindi)' }));
    expect(screen.getByRole('radio', { name: 'हिन्दी' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Check this message' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many checks.');

    respond({ ...RESULT, urgent: false, verdict: 'safe', flags: [] });
    await user.click(screen.getByRole('button', { name: 'Check this message' }));
    await user.click(await screen.findByRole('button', { name: 'दूसरा मैसेज जाँचें' }));
    expect(screen.getByText(/will appear here/)).toBeInTheDocument();
  });

  it('copies a family warning when sharing is not available', async () => {
    window.history.replaceState(null, '', '/check');
    respond(RESULT);
    const user = userEvent.setup();
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<App />);
    await user.type(await screen.findByLabelText(/paste the message/i), 'x');
    await user.click(screen.getByRole('button', { name: 'Check this message' }));
    await user.click(await screen.findByRole('button', { name: 'Warn my family' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('This is a scam'));
    expect(await screen.findByRole('status')).toHaveTextContent('Warning copied');
  });
});

describe('client helpers', () => {
  it('builds a short warning with a link back', () => {
    expect(warningText(RESULT, 'en', 'https://rukjao.test')).toBe('This is a scam. Police never arrest on video calls.\nCall 1930 now.\nhttps://rukjao.test/check');
  });

  it('prefers the native share sheet and reports failures', async () => {
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    expect(await shareWarning('hi')).toBe(true);
    share.mockRejectedValueOnce(new Error('cancelled'));
    expect(await shareWarning('hi')).toBe(false);
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });

  it('turns unreadable server errors into a helpful message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('oops', { status: 502 }));
    await expect(postCheck({ message: 'x', persona: 'general', channel: 'sms', action: 'none', language: 'en' })).rejects.toThrow(/could not check/);
  });

  it('keeps routing in sync with history', () => {
    render(<App />);
    act(() => {
      navigate('/check');
    });
    expect(window.location.pathname).toBe('/check');
  });
});
