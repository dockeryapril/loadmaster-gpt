/**
 * Feature flags for LoadMaster reboot
 * Features are enabled progressively in each phase
 */
export const features = {
  // Phase 1: Core calculator only (current)
  ocrEnabled: false,
  authEnabled: false,
  supabaseSync: false,
  
  // Future phases (deferred)
  stripeIntegration: false,
  aiEnhancement: false,
  businessSetup: false,
  advancedNegotiation: false,
} as const;

export type FeatureFlag = keyof typeof features;

export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return features[flag];
};
