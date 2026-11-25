/**
 * Tests for the small server modules: the LRU cache, config defaults and both pattern
 * stores.
 *
 * @see TESTING.md
 */

import { describe, expect, it, vi } from 'vitest';
import { lruCache } from '../server/cache';
import { loadConfig } from '../server/config';
import { firestoreStore, memoryStore, weekBucket } from '../server/store/patterns';

describe('LRU cache', () => {
  it('evicts the least recently used entry', () => {
    const cache = lruCache<number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('missing')).toBeUndefined();
  });
});

describe('config', () => {
  it('uses safe defaults', () => {
    expect(loadConfig({})).toMatchObject({ port: 8080, geminiKey: '', onCloudRun: false, ratePerMinute: 20 });
  });

  it('reads Cloud Run and model settings', () => {
    const config = loadConfig({ K_SERVICE: 'rukjao', GEMINI_API_KEY: ' k ', GEMINI_MODELS: 'a, b,', PORT: '9000' });
    expect(config).toMatchObject({ onCloudRun: true, geminiKey: 'k', models: ['a', 'b'], port: 9000 });
  });
});

describe('pattern stores', () => {
  it('counts per tactic in memory', async () => {
    const store = memoryStore();
    await store.record('lottery');
    expect(await store.record('lottery')).toBe(2);
    expect(await store.record('fake_job')).toBe(1);
  });

  it('increments one Firestore document per tactic per week', async () => {
    const set = vi.fn(() => Promise.resolve());
    const get = vi.fn(() => Promise.resolve({ get: () => 7 }));
    const doc = vi.fn(() => ({ set, get }));
    const db = { collection: vi.fn(() => ({ doc })) };
    const store = firestoreStore(db as never, () => 0);
    expect(await store.record('lottery')).toBe(7);
    expect(doc).toHaveBeenCalledWith('0_lottery');
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ tactic: 'lottery' }), { merge: true });
  });

  it('reads a missing count as zero', async () => {
    const ref = { set: () => Promise.resolve(), get: () => Promise.resolve({ get: () => undefined }) };
    const db = { collection: () => ({ doc: () => ref }) };
    expect(await firestoreStore(db as never).record('delivery')).toBe(0);
  });

  it('buckets time into weeks', () => {
    expect(weekBucket(0)).toBe(0);
    expect(weekBucket(8 * 24 * 60 * 60 * 1000)).toBe(1);
  });
});
