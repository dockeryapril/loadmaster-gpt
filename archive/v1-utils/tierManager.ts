/**
 * Tier management utilities for testing
 * DEPRECATED: Use src/utils/tier.ts for new code
 */

import { getTier as getCentralizedTier, setTier as setCentralizedTier, isPro, isFree } from './tier';

// Legacy functions for backward compatibility
export function getCurrentTier(): 'lite' | 'pro' {
  console.warn('tierManager.getCurrentTier is deprecated, use src/utils/tier.ts instead');
  return getCentralizedTier();
}

export function switchToLite() {
  console.warn('tierManager.switchToLite is deprecated, use src/utils/tier.ts instead');
  setCentralizedTier('lite');
  console.log('Switched to Lite tier');
}

export function switchToPro() {
  console.warn('tierManager.switchToPro is deprecated, use src/utils/tier.ts instead');
  setCentralizedTier('pro');
  console.log('Switched to Pro tier');
}

// Add to window for testing in console with new centralized system
if (typeof window !== 'undefined') {
  (window as any).tierManager = {
    getCurrentTier: getCentralizedTier,
    switchToLite: () => {
      setCentralizedTier('lite');
      console.log('Switched to Lite tier');
    },
    switchToPro: () => {
      setCentralizedTier('pro');
      console.log('Switched to Pro tier');
    },
    // New centralized functions
    getTier: getCentralizedTier,
    isPro,
    isFree,
    setTier: setCentralizedTier,
  };
}