import type { StateCreator, StoreApi } from '../index';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface PersistOptions<S> {
  name: string;
  storage?: StorageLike | null;
  partialize?: (state: S) => unknown;
}

export const persist = <S>(config: StateCreator<S>, options: PersistOptions<S>): StateCreator<S> => {
  const { name, storage = typeof window !== 'undefined' ? window.localStorage : null, partialize } = options;

  return (set, get, api) => {
    const setPersist: StoreApi<S>['setState'] = (partial, replace) => {
      set(partial as any, replace);
      if (!storage) return;
      try {
        const state = partialize ? partialize(get()) : get();
        storage.setItem(name, JSON.stringify(state));
      } catch (error) {
        console.warn('[persist] Failed to save state', error);
      }
    };

    const hydratedState = config((partial, replace) => setPersist(partial, replace), get, {
      ...api,
      setState: setPersist,
    });

    if (storage) {
      try {
        const storedValue = storage.getItem(name);
        if (storedValue) {
          const parsed = JSON.parse(storedValue) as Partial<S>;
          set(parsed, false);
        }
      } catch (error) {
        console.warn('[persist] Failed to hydrate state', error);
      }
    }

    return hydratedState;
  };
};
