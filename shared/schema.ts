import { z } from 'zod';

// Our CSP forbids eval, so zod must not probe `new Function` for its fast path (Chrome logs that as a violation).
z.config({ jitless: true });

/** Who is asking: the action plan is phrased and prioritised for them. */
export const PERSONAS = ['general', 'elder', 'student', 'shopkeeper'] as const;
/** How the message reached the user. */
export const CHANNELS = ['sms', 'whatsapp', 'call', 'email'] as const;
/** What the user has already done: the biggest driver of the action plan. */
export const ACTIONS = ['none', 'clicked', 'shared', 'paid'] as const;
export const LANGUAGES = ['en', 'hi'] as const;
export const VERDICTS = ['safe', 'suspicious', 'scam'] as const;
/** Known scam families. A fixed list, so nothing user-written is ever stored. */
export const TACTICS = [
  'otp_theft',
  'upi_collect',
  'digital_arrest',
  'kyc_bank',
  'fake_job',
  'lottery',
  'delivery',
  'bill_disconnect',
  'investment',
  'remote_access',
  'unknown',
] as const;

export const MESSAGE_MAX = 2000;

/** Risk runs 0–100. The engine's verdict and the result meter share these thresholds. */
export const RISK_MAX = 100;
export const SUSPICIOUS_AT = 25;
export const SCAM_AT = 60;

export const checkRequestSchema = z.object({
  message: z.string().trim().min(1, 'Paste the message you want checked.').max(MESSAGE_MAX),
  persona: z.enum(PERSONAS),
  channel: z.enum(CHANNELS),
  action: z.enum(ACTIONS),
  language: z.enum(LANGUAGES),
});

export const flagSchema = z.object({
  id: z.string(),
  label: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});

export const checkResultSchema = z.object({
  verdict: z.enum(VERDICTS),
  risk: z.number().int().min(0).max(RISK_MAX),
  tactic: z.enum(TACTICS),
  urgent: z.boolean(),
  flags: z.array(flagSchema),
  steps: z.array(z.string()),
  explanation: z.string(),
  source: z.enum(['ai', 'engine']),
  seenThisWeek: z.number().int().nonnegative(),
});

export type CheckRequest = z.infer<typeof checkRequestSchema>;
export type CheckResult = z.infer<typeof checkResultSchema>;
export type Flag = z.infer<typeof flagSchema>;
export type Verdict = (typeof VERDICTS)[number];
export type Tactic = (typeof TACTICS)[number];
export type Persona = (typeof PERSONAS)[number];
export type Language = (typeof LANGUAGES)[number];
