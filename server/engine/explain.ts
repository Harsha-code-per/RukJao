/**
 * Offline explanation: a short "why" built only from what the rule engine found, in
 * English or Hindi.
 *
 * Used whenever Gemini is switched off or fails, so every answer still names the
 * warning signs and the trick. `TACTIC_NAMES` gives each scam family its reader-facing
 * name. Called by `server/checker.ts`.
 *
 * @see docs/DECISIONS.md › 1. Rule engine first, AI second
 */

import type { Flag, Language, Tactic, Verdict } from '../../shared/schema';

interface Outcome {
  verdict: Verdict;
  tactic: Tactic;
}

/** Reader-facing name of each scam family. */
export const TACTIC_NAMES: Record<Tactic, Record<Language, string>> = {
  otp_theft: { en: 'an OTP theft scam', hi: 'OTP चोरी का धोखा' },
  upi_collect: { en: 'a UPI "receive money" scam', hi: 'UPI "पैसे पाओ" धोखा' },
  digital_arrest: { en: 'a fake "digital arrest" scam', hi: 'नकली "डिजिटल अरेस्ट" धोखा' },
  kyc_bank: { en: 'a fake KYC or bank-block scam', hi: 'नकली KYC या खाता-बंद धोखा' },
  fake_job: { en: 'a fake job or task scam', hi: 'नकली नौकरी या टास्क धोखा' },
  lottery: { en: 'a fake prize or lottery scam', hi: 'नकली इनाम या लॉटरी धोखा' },
  delivery: { en: 'a fake parcel or courier scam', hi: 'नकली पार्सल या कूरियर धोखा' },
  bill_disconnect: { en: 'a fake electricity-bill scam', hi: 'नकली बिजली बिल धोखा' },
  investment: { en: 'a fake investment scam', hi: 'नकली निवेश धोखा' },
  remote_access: { en: 'a screen-sharing app scam', hi: 'स्क्रीन शेयर ऐप धोखा' },
  unknown: { en: 'a known scam pattern', hi: 'एक जाना-पहचाना धोखा' },
};

const OPENERS: Record<Verdict, Record<Language, string>> = {
  scam: { en: 'This is very likely a scam.', hi: 'यह लगभग पक्का धोखा है।' },
  suspicious: { en: 'Be careful: this message has warning signs.', hi: 'सावधान: इस मैसेज में खतरे के संकेत हैं।' },
  safe: { en: 'We found no common scam signs in this message.', hi: 'इस मैसेज में धोखे के आम संकेत नहीं मिले।' },
};

const SIGNS: Record<Language, string> = { en: 'Warning signs', hi: 'खतरे के संकेत' };
const MATCHES: Record<Language, string> = { en: 'It follows the pattern of', hi: 'यह इस तरह का है:' };
const STOP: Record<Language, string> = { en: '.', hi: '।' };

/** Plain-language explanation built only from what the rule engine found. Used when AI is unavailable. */
export const explain = ({ verdict, tactic }: Outcome, flags: Flag[], language: Language): string => {
  const parts = [OPENERS[verdict][language]];
  const labels = [...new Set(flags.map((flag) => flag.label))];
  if (labels.length > 0) parts.push(`${SIGNS[language]}: ${labels.join('; ')}${STOP[language]}`);
  if (verdict !== 'safe' && tactic !== 'unknown') parts.push(`${MATCHES[language]} ${TACTIC_NAMES[tactic][language]}${STOP[language]}`);
  return parts.join(' ');
};
