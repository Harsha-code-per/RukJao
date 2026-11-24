import { describe, expect, it, vi } from 'vitest';
import type { CheckRequest } from '../shared/schema';
import type { AiReview, Reviewer } from '../server/ai/gemini';
import { createChecker, locateAiFlags, mergeVerdict } from '../server/checker';
import { memoryStore, type PatternStore } from '../server/store/patterns';

const request = (message: string): CheckRequest => ({ message, persona: 'general', channel: 'sms', action: 'none', language: 'en' });
const review = (patch: Partial<AiReview> = {}): AiReview => ({ verdict: 'scam', tactic: 'fake_job', explanation: 'AI says no.', redFlags: [], ...patch });

describe('merging the AI review', () => {
  const engine = { verdict: 'scam' as const, risk: 70, tactic: 'otp_theft' as const };

  it('never lets the AI soften the verdict', () => {
    expect(mergeVerdict(engine, review({ verdict: 'safe' }))).toEqual(engine);
  });

  it('lets the AI raise the verdict and lifts the risk to match', () => {
    const merged = mergeVerdict({ verdict: 'safe', risk: 0, tactic: 'unknown' }, review({ verdict: 'suspicious' }));
    expect(merged).toEqual({ verdict: 'suspicious', risk: 25, tactic: 'fake_job' });
  });

  it('keeps the engine result when there is no review', () => {
    expect(mergeVerdict(engine, null)).toBe(engine);
  });

  it('places quoted red flags and drops invented ones', () => {
    const flags = locateAiFlags('pay the joining fee now', review({ redFlags: [{ quote: 'joining fee', reason: 'Fee' }, { quote: 'not here', reason: 'x' }] }));
    expect(flags).toEqual([{ id: 'ai_signal', label: 'Fee', start: 8, end: 19 }]);
  });
});

describe('checker', () => {
  it('answers from the rule engine when AI is off', async () => {
    const check = createChecker({ review: null, store: memoryStore(), cacheSize: 5 });
    const result = await check(request('Share the OTP now'));
    expect(result).toMatchObject({ verdict: 'scam', source: 'engine', seenThisWeek: 1 });
    expect(result.explanation).toContain('scam');
  });

  it('uses the AI explanation when the model answers', async () => {
    const reviewer: Reviewer = vi.fn(() => Promise.resolve(review()));
    const result = await createChecker({ review: reviewer, store: memoryStore(), cacheSize: 5 })(request('Earn daily from home, part time'));
    expect(result).toMatchObject({ source: 'ai', explanation: 'AI says no.', verdict: 'scam' });
  });

  it('serves repeats from cache without calling the model or counting again', async () => {
    const reviewer = vi.fn<Reviewer>(() => Promise.resolve(review()));
    const check = createChecker({ review: reviewer, store: memoryStore(), cacheSize: 5 });
    await check(request('Share OTP'));
    const again = await check(request('Share OTP'));
    expect(reviewer).toHaveBeenCalledOnce();
    expect(again.seenThisWeek).toBe(1);
  });

  it('does not cache a fallback answer while AI is configured', async () => {
    const reviewer = vi.fn<Reviewer>(() => Promise.resolve(null));
    const check = createChecker({ review: reviewer, store: memoryStore(), cacheSize: 5 });
    await check(request('Share OTP'));
    await check(request('Share OTP'));
    expect(reviewer).toHaveBeenCalledTimes(2);
  });

  it('does not count safe messages and survives a broken store', async () => {
    const broken: PatternStore = { record: () => Promise.reject(new Error('offline')) };
    const check = createChecker({ review: null, store: broken, cacheSize: 5 });
    expect((await check(request('Hello'))).seenThisWeek).toBe(0);
    expect((await check(request('Share OTP'))).seenThisWeek).toBe(0);
  });
});
