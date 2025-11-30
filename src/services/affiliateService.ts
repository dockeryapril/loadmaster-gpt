import { supabase } from '@/integrations/supabase/client';
import type { AffiliateOffer, AffiliateContext, AffiliateConditions } from '@/types/affiliate';

/**
 * Fetch and filter affiliate offers based on context
 */
export async function getAffiliateOffers(context: AffiliateContext): Promise<AffiliateOffer[]> {
  // 1. Fetch active offers for this screen
  const { data: offers, error } = await supabase
    .from('affiliate_offers')
    .select('*')
    .eq('is_active', true)
    .contains('placement', [context.screen])
    .order('priority', { ascending: true });

  if (error || !offers) {
    console.debug('Failed to fetch affiliate offers:', error);
    return [];
  }

  // 2. Filter by conditions
  const filtered = offers.filter((offer) => {
    const conditions = offer.conditions as AffiliateConditions;
    
    // Equipment type filter
    if (conditions.equipment_types && context.equipmentType) {
      if (!conditions.equipment_types.includes(context.equipmentType)) return false;
    }
    
    // User pays fuel filter
    if (conditions.requires_user_pays_fuel !== undefined && context.userPaysFuel !== undefined) {
      if (conditions.requires_user_pays_fuel !== context.userPaysFuel) return false;
    }
    
    // RPM range filters
    if (conditions.min_rpm !== undefined && context.rpm !== undefined) {
      if (context.rpm < conditions.min_rpm) return false;
    }
    if (conditions.max_rpm !== undefined && context.rpm !== undefined) {
      if (context.rpm > conditions.max_rpm) return false;
    }
    
    // Required signals filter (at least one overlap)
    if (conditions.required_signals?.length && context.signals?.length) {
      const hasOverlap = conditions.required_signals.some(s => context.signals!.includes(s));
      if (!hasOverlap) return false;
    } else if (conditions.required_signals?.length && !context.signals?.length) {
      return false; // Required signals but none provided
    }
    
    // Has offer history filter
    if (conditions.requires_has_offer_history !== undefined && context.hasOfferHistory !== undefined) {
      if (conditions.requires_has_offer_history !== context.hasOfferHistory) return false;
    }
    
    return true;
  });

  return filtered as AffiliateOffer[];
}

/**
 * Track affiliate click - fire and forget
 */
export async function trackAffiliateClick(
  offer: AffiliateOffer,
  context: AffiliateContext
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fire and forget - don't await
    supabase.from('affiliate_clicks').insert({
      offer_id: offer.id,
      user_id: user?.id || null,
      context,
    });
  } catch (error) {
    console.debug('Failed to track affiliate click:', error);
  }
}

/**
 * Handle affiliate link click - track and open URL
 */
export function handleAffiliateClick(offer: AffiliateOffer, context: AffiliateContext): void {
  // Track click (fire and forget)
  trackAffiliateClick(offer, context);
  
  // Open URL in new tab
  window.open(offer.url, '_blank', 'noopener,noreferrer');
}
