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

    let finalState = hydratedState;

    if (storage) {
      try {
        let storedValue = storage.getItem(name);
        
        // Migration: check for old key if new key doesn't exist
        if (!storedValue && name === 'lm:v2:state') {
          const oldKey = 'loadmaster-decisions';
          const oldData = storage.getItem(oldKey);
          
          if (oldData) {
            try {
              const parsed = JSON.parse(oldData);
              
              // Migrate and save to new key
              if (Array.isArray(parsed)) {
                // Old format: just history array
                storedValue = JSON.stringify({ history: parsed });
              } else if (parsed && typeof parsed === 'object' && ('history' in parsed || 'costProfile' in parsed)) {
                // Old format: object with history/costProfile
                storedValue = JSON.stringify({
                  history: Array.isArray(parsed.history) ? parsed.history : [],
                  costProfile: parsed.costProfile || undefined,
                });
              }
              
              if (storedValue) {
                storage.setItem(name, storedValue);
                storage.removeItem(oldKey);
                console.log('[persist] Migrated data from', oldKey, 'to', name);
              }
            } catch (migrationError) {
              console.warn('[persist] Migration failed', migrationError);
            }
          }
        }
        
        // Normal hydration logic
        if (storedValue) {
          const parsed = JSON.parse(storedValue);

          // Only hydrate if parsed is a valid object
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            // Filter out undefined or null values and sanitize known shapes
            const filteredState = Object.entries(parsed).reduce((acc, [key, value]) => {
              if (value === undefined || value === null) return acc;
              if (key === 'costProfile') {
                // Ensure costProfile is a plain object
                if (typeof value !== 'object' || Array.isArray(value)) return acc;
              }
              (acc as any)[key] = value;
              return acc;
            }, {} as any);

            finalState = {
              ...hydratedState,
              ...(filteredState as Partial<S>),
            };
          } else {
            console.warn('[persist] Invalid stored state format, skipping hydration');
            storage.removeItem(name);
          }
        }
      } catch (error) {
        console.warn('[persist] Failed to hydrate state', error);
        // Clean up corrupted data
        try {
          storage.removeItem(name);
        } catch (cleanupError) {
          console.warn('[persist] Failed to clean up corrupted state', cleanupError);
        }
      }
    }

    return finalState;
  };
};
