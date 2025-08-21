export const isDebugMode = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get('debug') === '1';
};

export const debugLog = (...args: unknown[]) => {
  if (isDebugMode()) {
    console.debug(...args);
  }
};
