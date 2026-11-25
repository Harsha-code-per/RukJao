/**
 * State for one check: idle, loading, then done or error.
 *
 * A new check or a reset aborts the request in flight, so a slow answer can never
 * replace a newer one. Calls `src/lib/api.ts`; used by `CheckPage.tsx`.
 */

import { useRef, useState } from 'react';
import type { CheckRequest, CheckResult } from '../../shared/schema';
import { postCheck } from '../lib/api';

/** Where the current check is. `done` keeps the request so the result can quote the message. */
export type CheckState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'done'; result: CheckResult; request: CheckRequest };

/** Runs one check at a time; a new check cancels the one in flight. */
export const useCheck = () => {
  const [state, setState] = useState<CheckState>({ status: 'idle' });
  const inFlight = useRef<AbortController | null>(null);

  const run = async (request: CheckRequest): Promise<void> => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setState({ status: 'loading' });
    try {
      const result = await postCheck(request, controller.signal);
      setState({ status: 'done', result, request });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  };

  const reset = (): void => {
    inFlight.current?.abort();
    setState({ status: 'idle' });
  };

  return { state, run, reset };
};
