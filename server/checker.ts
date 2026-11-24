import { createHash } from 'node:crypto';
import type { CheckRequest, CheckResult, Flag, Verdict } from '../shared/schema';
import type { AiReview, Reviewer } from './ai/gemini';
import { lruCache } from './cache';
import { assess, detect, SCAM_AT, SUSPICIOUS_AT, type Assessment } from './engine/analyze';
import { explain } from './engine/explain';
import { buildPlan, isUrgent } from './engine/plan';
import { AI_FLAG_ID } from './engine/rules';
import type { PatternStore } from './store/patterns';

const SEVERITY: Record<Verdict, number> = { safe: 0, suspicious: 1, scam: 2 };
const RISK_FLOOR: Record<Verdict, number> = { safe: 0, suspicious: SUSPICIOUS_AT, scam: SCAM_AT };

export interface CheckerDeps {
  review: Reviewer | null;
  store: PatternStore;
  cacheSize: number;
}

export type Checker = (request: CheckRequest) => Promise<CheckResult>;

/** AI may raise the verdict, never lower it: a hard rule hit stays a scam whatever the model says. */
export const mergeVerdict = (engine: Assessment, review: AiReview | null): Assessment => {
  if (review === null) return engine;
  const verdict = SEVERITY[review.verdict] > SEVERITY[engine.verdict] ? review.verdict : engine.verdict;
  return {
    verdict,
    risk: Math.max(engine.risk, RISK_FLOOR[verdict]),
    tactic: engine.tactic === 'unknown' ? review.tactic : engine.tactic,
  };
};

/** Places the model's quoted red flags back into the message. Quotes it invented are dropped. */
export const locateAiFlags = (message: string, review: AiReview | null): Flag[] =>
  (review?.redFlags ?? []).flatMap(({ quote, reason }) => {
    const start = message.indexOf(quote);
    return start < 0 ? [] : [{ id: AI_FLAG_ID, label: reason, start, end: start + quote.length }];
  });

const cacheKey = (request: CheckRequest): string => createHash('sha256').update(JSON.stringify(request)).digest('hex');

const countSighting = async (store: PatternStore, outcome: Assessment): Promise<number> => {
  if (outcome.verdict === 'safe') return 0;
  try {
    return await store.record(outcome.tactic);
  } catch (error) {
    console.warn('Pattern count unavailable', error instanceof Error ? error.message : error);
    return 0;
  }
};

const analyse = async (request: CheckRequest, deps: CheckerDeps): Promise<CheckResult> => {
  const { flags, signals } = detect(request.message, request.language);
  const engine = assess(signals);
  const signs = [...new Set(flags.map((flag) => flag.label))];
  const review = deps.review ? await deps.review(request, { ...engine, signs }) : null;
  const outcome = mergeVerdict(engine, review);
  const allFlags = [...flags, ...locateAiFlags(request.message, review)].sort((a, b) => a.start - b.start);
  return {
    ...outcome,
    urgent: isUrgent(outcome.verdict, request.action),
    flags: allFlags,
    steps: buildPlan(outcome, request),
    explanation: review?.explanation ?? explain(outcome, flags, request.language),
    source: review ? 'ai' : 'engine',
    seenThisWeek: await countSighting(deps.store, outcome),
  };
};

/** Rule engine first, AI second, plan last. Repeat checks are served from cache and not counted twice. */
export const createChecker = (deps: CheckerDeps): Checker => {
  const cache = lruCache<CheckResult>(deps.cacheSize);
  return async (request) => {
    const key = cacheKey(request);
    const hit = cache.get(key);
    if (hit) return hit;
    const result = await analyse(request, deps);
    // A fallback answer is not cached while AI is configured, so the next try can still reach the model.
    if (result.source === 'ai' || deps.review === null) cache.set(key, result);
    return result;
  };
};
