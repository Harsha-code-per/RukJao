import { describe, expect, it } from 'vitest';
import type { CheckRequest } from '../shared/schema';
import { buildPlan, chooseSteps, isUrgent } from '../server/engine/plan';

const context = (patch: Partial<CheckRequest> = {}): CheckRequest => ({
  message: 'x',
  persona: 'general',
  channel: 'sms',
  action: 'none',
  language: 'en',
  ...patch,
});

describe('action plan', () => {
  it('puts 1930 first once money has moved', () => {
    expect(chooseSteps({ verdict: 'scam', tactic: 'upi_collect' }, context({ action: 'paid' }))[0]).toBe('call_1930');
  });

  it('blocks the bank first after an OTP was shared', () => {
    expect(chooseSteps({ verdict: 'scam', tactic: 'otp_theft' }, context({ action: 'shared' }))[0]).toBe('block_bank');
  });

  it('tells a caller to hang up and an SMS reader to report on Chakshu', () => {
    expect(chooseSteps({ verdict: 'scam', tactic: 'digital_arrest' }, context({ channel: 'call' }))).toContain('hang_up');
    expect(chooseSteps({ verdict: 'scam', tactic: 'digital_arrest' }, context())).toContain('report_chakshu');
  });

  it('adds the trick-specific fact and the persona step, without repeats', () => {
    const steps = chooseSteps({ verdict: 'suspicious', tactic: 'upi_collect' }, context({ persona: 'shopkeeper' }));
    expect(steps.filter((s) => s === 'pin_never_receives')).toHaveLength(1);
    expect(chooseSteps({ verdict: 'scam', tactic: 'fake_job' }, context({ persona: 'elder' }))).toContain('tell_family');
  });

  it('only asks to verify when nothing looks wrong', () => {
    expect(chooseSteps({ verdict: 'safe', tactic: 'unknown' }, context({ action: 'paid' }))).toEqual(['verify_official']);
  });

  it('writes the plan in the chosen language', () => {
    const [first] = buildPlan({ verdict: 'scam', tactic: 'unknown' }, context({ action: 'paid', language: 'hi' }));
    expect(first).toContain('1930');
    expect(first).toMatch(/[ऀ-ॿ]/);
  });

  it('is urgent only when something was given away on a risky message', () => {
    expect(isUrgent('scam', 'paid')).toBe(true);
    expect(isUrgent('suspicious', 'shared')).toBe(true);
    expect(isUrgent('scam', 'clicked')).toBe(false);
    expect(isUrgent('safe', 'paid')).toBe(false);
  });
});
