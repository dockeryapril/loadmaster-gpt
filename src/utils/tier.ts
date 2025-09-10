/**
 * Centralized tier management with normalization
 * Treats 'core' and 'lite' as synonyms for the free tier
 */

export type Tier = 'lite' | 'core' | 'pro';
export type NormalizedTier = 'lite' | 'pro';

const NORMALIZED: Record<string, NormalizedTier> = {
  lite: 'lite',
  core: 'lite',     // alias - core becomes lite
  pro: 'pro',
};

/**
 * Get the current tier with normalization
 * Priority: URL (?tier=...), then localStorage('lm_tier'), then default 'lite'
 */
export function getTier(): NormalizedTier {
  if (typeof window === 'undefined') {
    return 'lite'; // Default for server-side
  }

  // Check URL parameter first (highest priority)
  const urlTier = new URLSearchParams(window.location.search).get('tier')?.toLowerCase();
  
  // Check localStorage second
  const lsTier = (localStorage.getItem('lm_tier') || '').toLowerCase();
  
  // Get raw tier value
  const raw = urlTier || lsTier || 'lite';
  
  // Normalize the tier
  const normalized = NORMALIZED[raw] || 'lite';
  
  // Migrate storage to normalized value so UI stays consistent
  if (lsTier && lsTier !== normalized) {
    localStorage.setItem('lm_tier', normalized);
    console.log(`Migrated tier from '${lsTier}' to '${normalized}'`);
  }
  
  return normalized;
}

/**
 * Check if user is on Pro tier
 */
export const isPro = (): boolean => getTier() === 'pro';

/**
 * Check if user is on free tier (includes both 'lite' and 'core')
 */
export const isFree = (): boolean => getTier() === 'lite';

/**
 * Set tier with normalization
 */
export function setTier(tier: Tier): void {
  if (typeof window === 'undefined') return;
  
  const normalized = NORMALIZED[tier] || 'lite';
  localStorage.setItem('lm_tier', normalized);
}

/**
 * Get tier for display purposes (shows "Free" instead of "lite")
 */
export function getTierDisplay(): string {
  if (typeof window === 'undefined') return 'Free';
  
  const current = getTier();
  
  // Always show 'Free' for lite tier, 'PRO' for pro tier
  return current === 'lite' ? 'Free' : 'PRO';
}

/**
 * Normalize any tier string to canonical form
 */
export function normalizeTier(tier: string): NormalizedTier {
  return NORMALIZED[tier.toLowerCase()] || 'lite';
}