export type AffiliateCategory = 'factoring' | 'fuel_card' | 'load_board' | 'insurance' | 'tax_software';

export type AffiliatePlacement = 'dashboard' | 'offer_result' | 'empty_state';

export type AffiliateConditions = {
  equipment_types?: ('cargo_van' | 'hotshot' | 'straight_truck' | 'other')[];
  requires_user_pays_fuel?: boolean;
  min_rpm?: number;
  max_rpm?: number;
  required_signals?: string[];
  requires_has_offer_history?: boolean;
};

export interface AffiliateOffer {
  id: string;
  slug: string;
  name: string;
  category: AffiliateCategory;
  description: string;
  url: string;
  placement: AffiliatePlacement[];
  conditions: AffiliateConditions;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AffiliateContext {
  screen: AffiliatePlacement;
  equipmentType?: 'cargo_van' | 'straight_truck' | 'hotshot' | 'other';
  userPaysFuel?: boolean;
  rpm?: number;
  weightClass?: 'light' | 'medium' | 'heavy';
  hasOfferHistory?: boolean;
  signals?: string[];
}
