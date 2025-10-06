import { useDebugValue, useSyncExternalStore } from 'react';

type SetStateInternal<S> = (partial: Partial<S> | S | ((state: S) => Partial<S> | S), replace?: boolean) => void;
type GetState<S> = () => S;
type Listener<S> = (state: S, previousState: S) => void;

type StateCreator<S> = (
  set: SetStateInternal<S>,
  get: GetState<S>,
  api: StoreApi<S>,
) => S;

export interface StoreApi<S> {
  setState: SetStateInternal<S>;
  getState: GetState<S>;
  subscribe: (listener: Listener<S>) => () => void;
  destroy: () => void;
}

export type UseBoundStore<S> = {
  (): S;
  <T>(selector: (state: S) => T, equalityFn?: (a: T, b: T) => boolean): T;
} & StoreApi<S>;

const defaultEquality = Object.is;

function createStore<S>(initializer: StateCreator<S>): UseBoundStore<S> {
  let state: S;
  const listeners = new Set<Listener<S>>();

  const getState: GetState<S> = () => state;

  const setState: SetStateInternal<S> = (partial, replace) => {
    const nextState = typeof partial === 'function' ? (partial as (state: S) => Partial<S> | S)(state) : partial;
    if (nextState === state) return;
    const previousState = state;
    state = replace ? (nextState as S) : { ...state, ...(nextState as Partial<S>) };
    listeners.forEach((listener) => listener(state, previousState));
  };

  const subscribe: StoreApi<S>['subscribe'] = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const destroy = () => {
    listeners.clear();
  };

  const api: StoreApi<S> = {
    setState,
    getState,
    subscribe,
    destroy,
  };

  state = initializer(setState, getState, api);

  function useStore<T>(selector?: (state: S) => T, equalityFn: (a: T, b: T) => boolean = defaultEquality) {
    const select = selector ?? ((state: S) => state as unknown as T);

    let currentSlice = select(state);

    return useSyncExternalStore(
      (onStoreChange) =>
        subscribe((newState) => {
          const nextSlice = select(newState);
          if (!equalityFn(nextSlice, currentSlice)) {
            currentSlice = nextSlice;
            onStoreChange();
          }
        }),
      () => select(state),
      () => select(state),
    );
  }

  function useStoreWithDebug<T>(selector?: (state: S) => T, equalityFn?: (a: T, b: T) => boolean) {
    const value = useStore(selector, equalityFn as (a: T, b: T) => boolean);
    useDebugValue(value);
    return value;
  }

  Object.assign(useStoreWithDebug, api);

  return useStoreWithDebug as UseBoundStore<S>;
}

export function create<S>(): (initializer: StateCreator<S>) => UseBoundStore<S>;
export function create<S>(initializer: StateCreator<S>): UseBoundStore<S>;
export function create<S>(initializer?: StateCreator<S>) {
  if (initializer) {
    return createStore(initializer);
  }
  return (stateCreator: StateCreator<S>) => createStore(stateCreator);
}

export type { StateCreator };
