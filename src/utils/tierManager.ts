/**
 * Tier management utilities for testing
 */

import { getTier, setTier } from './deviceId';

export function getCurrentTier(): 'lite' | 'pro' {
  return getTier();
}

export function switchToLite() {
  setTier('lite');
  console.log('Switched to Lite tier');
}

export function switchToPro() {
  setTier('pro');
  console.log('Switched to Pro tier');
}

// Add to window for testing in console
if (typeof window !== 'undefined') {
  (window as any).tierManager = {
    getCurrentTier,
    switchToLite,
    switchToPro,
  };
}