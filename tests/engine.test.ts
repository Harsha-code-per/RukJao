import { describe, expect, it } from 'vitest';
import { assess, detect } from '../server/engine/analyze';
import { SCAM_AT } from '../shared/schema';
import { explain } from '../server/engine/explain';
import { findRiskyLinks, isRiskyLink } from '../server/engine/links';

const run = (message: string, language: 'en' | 'hi' = 'en') => {
  const found = detect(message, language);
  return { ...found, ...assess(found.signals) };
};

describe('rule engine', () => {
  it.each([
    ['Please share the OTP you just received to verify your account', 'otp_theft'],
    ['Scan this QR to receive the refund and enter your UPI PIN to receive money', 'upi_collect'],
    ['Install AnyDesk so our executive can help you', 'remote_access'],
    ['This is CBI. You are under digital arrest, stay on video call', 'digital_arrest'],
  ])('treats a hard signal as a scam: %s', (message, tactic) => {
    const result = run(message);
    expect(result.verdict).toBe('scam');
    expect(result.risk).toBeGreaterThanOrEqual(SCAM_AT);
    expect(result.tactic).toBe(tactic);
  });

  it('adds soft signals together and counts each rule once', () => {
    const result = run('You won the lottery! Lucky draw winner. Pay processing fee to claim your prize.');
    expect(result.tactic).toBe('lottery');
    expect(result.signals.map((s) => s.id).sort()).toEqual(['payment_push', 'prize']);
    expect(result.verdict).toBe('scam');
  });

  it('marks a single soft signal as suspicious', () => {
    expect(run('Part time work from home, message me').verdict).toBe('suspicious');
  });

  it('leaves an ordinary message safe and a genuine OTP notice safe', () => {
    expect(run('Reached home safely, call you later').verdict).toBe('safe');
    const otp = run('482913 is your login OTP. Do not share it with anyone.');
    expect(otp.verdict).toBe('safe');
    expect(otp.tactic).toBe('unknown');
  });

  it('reads Hindi messages and labels flags in Hindi', () => {
    const result = run('आपका बिजली कनेक्शन आज रात काट दिया जाएगा। तुरंत इस नंबर पर कॉल करें।', 'hi');
    expect(result.tactic).toBe('bill_disconnect');
    expect(result.verdict).toBe('scam');
    expect(result.flags[0]?.label).toMatch(/[ऀ-ॿ]/);
  });

  it('keeps flag spans pointing at the matched text, in order', () => {
    const message = 'Urgent: your KYC will expire. Update at bit.ly/abc';
    const { flags } = run(message);
    expect(flags.map((f) => f.start)).toEqual([...flags.map((f) => f.start)].sort((a, b) => a - b));
    expect(flags.some((f) => message.slice(f.start, f.end) === 'bit.ly/abc')).toBe(true);
  });
});

describe('link checker', () => {
  it.each(['http://example.com/login', 'bit.ly/x1', 'https://192.168.1.4/pay', 'https://sbi-rewards.xyz/a', 'https://xn--sb-rka.com/', 'https://files.example.com/app.apk', 'https://hdfc-kyc-update.com/'])(
    'flags %s',
    (link) => {
      expect(isRiskyLink(link)).toBe(true);
    },
  );

  it.each(['https://www.onlinesbi.sbi/', 'https://uidai.gov.in/', 'https://www.hdfcbank.com/', 'https://example.com/help'])('trusts %s', (link) => {
    expect(isRiskyLink(link)).toBe(false);
  });

  it('finds bare and schemed links inside text', () => {
    const hits = findRiskyLinks('Pay at http://pay.example.com/x or https://example.com/ok today');
    expect(hits).toHaveLength(1);
  });

  it('treats an unparseable link as risky', () => {
    expect(isRiskyLink('http://exa mple')).toBe(true);
  });
});

describe('fallback explanation', () => {
  it('names the verdict, the signs and the trick', () => {
    const text = explain({ verdict: 'scam', tactic: 'kyc_bank' }, [{ id: 'kyc_block', label: 'KYC threat', start: 0, end: 3 }], 'en');
    expect(text).toContain('very likely a scam');
    expect(text).toContain('KYC threat');
    expect(text).toContain('bank-block');
  });

  it('stays short when nothing was found', () => {
    expect(explain({ verdict: 'safe', tactic: 'unknown' }, [], 'hi')).toBe('इस मैसेज में धोखे के आम संकेत नहीं मिले।');
  });
});
