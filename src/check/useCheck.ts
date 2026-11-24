import { useRef, useState } from 'react';
import type { CheckRequest, CheckResult } from '../../shared/schema';
import { postCheck } from '../lib/api';

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
