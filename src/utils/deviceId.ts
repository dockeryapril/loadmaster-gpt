/**
 * Device ID and tier management utilities
 */

const DEVICE_ID_KEY = 'loadmaster_device_id';
const TIER_KEY = 'lm_tier';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getTier(user?: any): 'lite' | 'pro' {
  // DEPRECATED: Use src/utils/tier.ts instead
  // This function is kept for backward compatibility
  console.warn('deviceId.getTier is deprecated, use src/utils/tier.ts instead');
  
  // Check user metadata first
  if (user?.app_metadata?.tier === 'pro') {
    return 'pro';
  }
  
  // Import and use the centralized tier system
  if (typeof window !== 'undefined') {
    const { getTier: getCentralizedTier } = require('./tier');
    return getCentralizedTier();
  }
  
  return 'lite'; // Default to lite for server-side
}

export function setTier(tier: 'lite' | 'pro') {
  // DEPRECATED: Use src/utils/tier.ts instead
  console.warn('deviceId.setTier is deprecated, use src/utils/tier.ts instead');
  
  if (typeof window !== 'undefined') {
    const { setTier: setCentralizedTier } = require('./tier');
    setCentralizedTier(tier);
  } else {
    localStorage.setItem(TIER_KEY, tier);
  }
}