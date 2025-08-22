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
  // Check user metadata first
  if (user?.app_metadata?.tier === 'pro') {
    return 'pro';
  }
  
  // Check localStorage tier setting
  const tier = localStorage.getItem(TIER_KEY);
  if (tier === 'pro') {
    return 'pro';
  }
  
  return 'lite'; // Default to lite
}

export function setTier(tier: 'lite' | 'pro') {
  localStorage.setItem(TIER_KEY, tier);
}