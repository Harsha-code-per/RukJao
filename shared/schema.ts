/**
 * The contract between server, client and model: every enum, limit and shape, in one
 * file.
 *
 * The server validates requests with it, the client validates responses with it, and
 * `server/ai/gemini.ts` builds Gemini's response schema from it. The risk thresholds
 * here decide the engine's verdict, bound the API's `risk` field and set the result
 * meter's colours, so the three can never disagree.
 *
 * @see docs/DECISIONS.md › 4. One zod contract for server, client and model
 */

import { z } from 'zod';

// Our CSP forbids eval, so zod must not probe `new Function` for its fast path (Chrome logs that as a violation).
z.config({ jitless: true });

/** Who is asking: the action plan is phrased and prioritised for them. */
export const PERSONAS = ['general', 'elder', 'student', 'shopkeeper'] as const;
/** How the message reached the user. */
export const CHANNELS = ['sms', 'whatsapp', 'call', 'email'] as const;
/** What the user has already done: the biggest driver of the action plan. */
export const ACTIONS = ['none', 'clicked', 'shared', 'paid'] as const;
/** Languages the answer can be written in. */
export const LANGUAGES = ['en', 'hi'] as const;
/** From least to most severe. */
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

/** Longest message accepted, in characters. */
export const MESSAGE_MAX = 2000;

/** Risk runs 0–100. The engine's verdict and the result meter share these thresholds. */
export const RISK_MAX = 100;
/** Lowest risk that is no longer "safe". */
export const SUSPICIOUS_AT = 25;
/** Lowest risk that is a scam even without a hard rule. */
export const SCAM_AT = 60;

/** What the client sends: the message and the context that shapes the plan. */
export const checkRequestSchema = z.object({
  message: z.string().trim().min(1, 'Paste the message you want checked.').max(MESSAGE_MAX),
  persona: z.enum(PERSONAS),
  channel: z.enum(CHANNELS),
  action: z.enum(ACTIONS),
  language: z.enum(LANGUAGES),
});

/** One red flag and the span of message text it covers. */
export const flagSchema = z.object({
  id: z.string(),
  label: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});

/** What the server returns, and what the client validates before rendering. */
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

/** Types derived from the schemas above, so they cannot drift from validation. */
export type CheckRequest = z.infer<typeof checkRequestSchema>;
export type CheckResult = z.infer<typeof checkResultSchema>;
export type Flag = z.infer<typeof flagSchema>;
export type Verdict = (typeof VERDICTS)[number];
export type Tactic = (typeof TACTICS)[number];
export type Persona = (typeof PERSONAS)[number];
export type Language = (typeof LANGUAGES)[number];
