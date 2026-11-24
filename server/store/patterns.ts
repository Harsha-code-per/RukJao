import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { Tactic } from '../../shared/schema';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Counts how often each scam family is checked this week. Stores a tactic id and a number, never message text. */
export interface PatternStore {
  record: (tactic: Tactic) => Promise<number>;
}

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
