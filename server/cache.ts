/**
 * In-memory LRU cache, so a repeated check costs neither a second model call nor a
 * second pattern count.
 *
 * Map keeps insertion order, so a read re-inserts its key and the first key is always
 * the least recently used. Sized by `CACHE_SIZE` (`server/config.ts`) and used only by
 * `server/checker.ts`.
 *
 * @see EFFICIENCY.md › Server
 */

/** Get and set; a get also marks the entry as recently used. */
export interface Cache<V> {
  get: (key: string) => V | undefined;
  set: (key: string, value: V) => void;
}

/** Creates a cache that holds at most `max` entries. */
export const lruCache = <V>(max: number): Cache<V> => {
  const entries = new Map<string, V>();
  return {
    get: (key) => {
      const value = entries.get(key);
      if (value === undefined) return undefined;
      entries.delete(key);
      entries.set(key, value);
      return value;
    },
    set: (key, value) => {
      entries.delete(key);
      entries.set(key, value);
      const oldest = entries.keys().next();
      if (entries.size > max && !oldest.done) entries.delete(oldest.value);
    },
  };
};
