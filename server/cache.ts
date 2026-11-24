/** Least-recently-used cache on top of Map's insertion order. */
export interface Cache<V> {
  get: (key: string) => V | undefined;
  set: (key: string, value: V) => void;
}

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
