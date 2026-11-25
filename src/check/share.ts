/**
 * "Warn my family": builds a short warning and hands it to the share sheet or the
 * clipboard.
 *
 * The text goes only where the user sends it; nothing is posted to RukJao's server.
 * Used by `Result.tsx`.
 *
 * @see SECURITY.md › Privacy
 */

import type { CheckResult, Language } from '../../shared/schema';
import { RESULT_COPY } from './copy';

/** A short warning someone can forward to a family group. */
export const warningText = (result: CheckResult, language: Language, origin: string): string => {
  const copy = RESULT_COPY[language];
  const firstStep = result.steps[0] ?? '';
  return `${copy.title[result.verdict]}. ${result.explanation}\n${firstStep}\n${origin}/check`;
};

/** Native share sheet where available, clipboard otherwise. Resolves true when the text left the page. */
export const shareWarning = async (text: string): Promise<boolean> => {
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ text });
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
