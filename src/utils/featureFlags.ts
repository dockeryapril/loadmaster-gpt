/**
 * Feature flags for LoadMaster reboot
 * Features are enabled progressively in each phase
 */
export const features = {
  // Phase 5: OCR enabled (current)
  ocrEnabled: true,
  supabaseSync: false,
  
  // Phase 6: Template negotiation enabled
  advancedNegotiation: true,
  
  // Future phases (deferred)
  stripeIntegration: false,
  aiEnhancement: false,
  businessSetup: false,
} as const;

export type FeatureFlag = keyof typeof features;

export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return features[flag];
};
