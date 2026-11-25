/**
 * Weekly scam-family counter behind "people checked this kind of trick N times this
 * week".
 *
 * It stores a tactic id and a number per week, never message text. Production uses
 * Firestore, one document per family per week updated with an atomic increment; local
 * runs and tests use a Map. Both satisfy `PatternStore`, and `server/index.ts` picks one.
 *
 * @see docs/DECISIONS.md › 6. Store counts, never messages
 * @see SECURITY.md › Privacy
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { Tactic } from '../../shared/schema';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Counts how often each scam family is checked this week. Stores a tactic id and a number, never message text. */
export interface PatternStore {
  record: (tactic: Tactic) => Promise<number>;
}

/** Week number since the epoch, so every instance counts into the same weekly document. */
export const weekBucket = (now: number): number => Math.floor(now / WEEK_MS);

/** Firestore-backed counter: one document per tactic per week, incremented atomically. */
export const firestoreStore = (db: Firestore, now: () => number = Date.now): PatternStore => ({
  record: async (tactic) => {
    const ref = db.collection('patterns').doc(`${weekBucket(now())}_${tactic}`);
    await ref.set({ tactic, count: FieldValue.increment(1) }, { merge: true });
    const snapshot = await ref.get();
    const count: unknown = snapshot.get('count');
    return typeof count === 'number' ? count : 0;
  },
});

/** In-process counter for local development and tests. */
export const memoryStore = (): PatternStore => {
  const counts = new Map<Tactic, number>();
  return {
    record: (tactic) => {
      const next = (counts.get(tactic) ?? 0) + 1;
      counts.set(tactic, next);
      return Promise.resolve(next);
    },
  };
};
