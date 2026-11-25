/**
 * Result-card wording in English and Hindi, chosen by the language picked for the answer.
 *
 * Kept out of the components so each pair of translations sits side by side for review.
 * Used by `Result.tsx` and `share.ts`.
 */

import type { CheckResult, Language, Verdict } from '../../shared/schema';

interface ResultCopy {
  title: Record<Verdict, string>;
  risk: (risk: number) => string;
  urgent: string;
  steps: string;
  why: string;
  marked: string;
  seen: (count: number) => string;
  source: Record<CheckResult['source'], string>;
  share: string;
  shared: string;
  again: string;
}

/** Result wording follows the language the person chose for the answer. */
export const RESULT_COPY: Record<Language, ResultCopy> = {
  en: {
    title: { scam: 'This is a scam', suspicious: 'This looks suspicious', safe: 'No scam signs found' },
    risk: (risk) => `Risk ${risk} of 100`,
    urgent: 'Act now: call 1930',
    steps: 'Do this now',
    why: 'Why',
    marked: 'What we marked in the message',
    seen: (count) => `People checked this kind of trick ${count} ${count === 1 ? 'time' : 'times'} on RukJao this week.`,
    source: { ai: 'Explained by Gemini, checked against RukJao’s rules.', engine: 'Explained by RukJao’s rules.' },
    share: 'Warn my family',
    shared: 'Warning copied. Paste it in your family group.',
    again: 'Check another message',
  },
  hi: {
    title: { scam: 'यह धोखा है', suspicious: 'यह संदिग्ध है', safe: 'धोखे के संकेत नहीं मिले' },
    risk: (risk) => `खतरा: 100 में से ${risk}`,
    urgent: 'अभी 1930 पर कॉल करें',
    steps: 'अभी यह करें',
    why: 'क्यों',
    marked: 'मैसेज में खतरे वाली बातें',
    seen: (count) => `इस हफ्ते RukJao पर इस तरह का धोखा ${count} बार जाँचा गया।`,
    source: { ai: 'Gemini ने समझाया, RukJao के नियमों से जाँचा गया।', engine: 'RukJao के नियमों से समझाया गया।' },
    share: 'परिवार को सावधान करें',
    shared: 'चेतावनी कॉपी हो गई। इसे परिवार के ग्रुप में भेजें।',
    again: 'दूसरा मैसेज जाँचें',
  },
};
