/**
 * Feature flags system for Core vs Pro tiers
 */

export type Tier = 'core' | 'pro';

export interface FeatureFlags {
  // Core features (available to everyone)
  ocrExtraction: boolean;
  editData: boolean;
  rpmCalculator: boolean;
  negotiationPanel: boolean;
  loadHistory: boolean;
  
  // Pro features (Pro tier only)
  advancedTemplates: boolean;
  historyExport: boolean;
  unlimitedLimits: boolean;
  prioritySupport: boolean;
}

export function flagsFor(tier: Tier): FeatureFlags {
  const coreFlags: FeatureFlags = {
    // Core features
    ocrExtraction: true,
    editData: true,
    rpmCalculator: true,
    negotiationPanel: true,
    loadHistory: true,
    
    // Pro features (disabled for core)
    advancedTemplates: false,
    historyExport: false,
    unlimitedLimits: false,
    prioritySupport: false,
  };

  if (tier === 'pro') {
    return {
      ...coreFlags,
      // Enable Pro features
      advancedTemplates: true,
      historyExport: true,
      unlimitedLimits: true,
      prioritySupport: true,
    };
  }

  return coreFlags;
}

export function getFeatureFlags(user?: any): FeatureFlags {
  const tier = user?.app_metadata?.tier === 'pro' ? 'pro' : 'core';
  return flagsFor(tier);
}