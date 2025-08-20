/**
 * Device ID and tier management utilities
 */

const DEVICE_ID_KEY = 'loadmaster_device_id';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getTier(user?: any): 'core' | 'pro' {
  // Simple implementation - can be extended with user data
  // For now, everyone is 'core' unless manually upgraded
  if (user?.app_metadata?.tier === 'pro') {
    return 'pro';
  }
  
  // Check for simple allowlist in localStorage for testing
  const allowlistTier = localStorage.getItem('loadmaster_tier_override');
  if (allowlistTier === 'pro') {
    return 'pro';
  }
  
  return 'core';
}

export function setTierOverride(tier: 'core' | 'pro' | null) {
  if (tier) {
    localStorage.setItem('loadmaster_tier_override', tier);
  } else {
    localStorage.removeItem('loadmaster_tier_override');
  }
}