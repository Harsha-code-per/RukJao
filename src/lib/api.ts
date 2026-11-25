/**
 * Client for `/api/check`.
 *
 * Every reply is parsed with `checkResultSchema`, so the UI never renders data it has
 * not validated. Server errors are already written for people and are shown as they
 * are; anything else becomes one friendly fallback. Called by `src/check/useCheck.ts`.
 *
 * @see docs/DECISIONS.md › 4. One zod contract for server, client and model
 */

import { checkResultSchema, type CheckRequest, type CheckResult } from '../../shared/schema';

const FALLBACK_ERROR = 'RukJao could not check this message. Check your connection and try again.';

const errorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === 'string' ? body.error : FALLBACK_ERROR;
  } catch {
    return FALLBACK_ERROR;
  }
};

/** Sends a message for checking and validates the reply against the shared schema. */
export const postCheck = async (request: CheckRequest, signal?: AbortSignal): Promise<CheckResult> => {
  const response = await fetch('/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: signal ?? null,
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return checkResultSchema.parse(await response.json());
};
