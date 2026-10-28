export type Listener<T> = (state: T, prev: T) => void;

export interface Store<T> {
  get(): T;
  /** Replace state immutably. Listeners fire only when the reference changes. */
  update(updater: (state: T) => T): void;
  subscribe(listener: Listener<T>): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener<T>>();
  return {
    get: () => state,
    update(updater) {
      const prev = state;
      const next = updater(prev);
      if (next === prev) return;
      state = next;
      for (const listener of listeners) listener(state, prev);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
