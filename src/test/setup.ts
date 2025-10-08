import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

// Extend expect with custom matchers for DOM elements
expect.extend({
  toBeInTheDocument(received: Element | null) {
    const pass = received !== null && document.body.contains(received);
    return {
      pass,
      message: () => pass
        ? `expected element not to be in document`
        : `expected element to be in document`,
    };
  },
});

// Type declarations for custom matchers
declare module 'vitest' {
  interface Assertion {
    toBeInTheDocument(): void;
  }
  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): void;
  }
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});
