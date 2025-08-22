/**
 * Feature flags system for Free vs Pro tiers
 */

import { getTier, isPro, isFree } from './tier';

export type Tier = 'lite' | 'pro';

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
  const freeFlags: FeatureFlags = {
    // Free tier features (available to lite/core)
    ocrExtraction: true,
    editData: true,
    rpmCalculator: true,
    negotiationPanel: true,
    loadHistory: true,
    
    // Pro features (disabled for free tier)
    advancedTemplates: false,
    historyExport: false,
    unlimitedLimits: false,
    prioritySupport: false,
  };

  if (tier === 'pro') {
    return {
      ...freeFlags,
      // Enable Pro features
      advancedTemplates: true,
      historyExport: true,
      unlimitedLimits: true,
      prioritySupport: true,
    };
  }

  return freeFlags;
}

export function getFeatureFlags(user?: any): FeatureFlags {
  // Use the centralized tier system, fallback to user metadata if available
  const userTier = user?.app_metadata?.tier;
  const tier = userTier === 'pro' ? 'pro' : getTier();
  return flagsFor(tier);
}