export interface UnifiedNegotiationScripts {
  ask: string;
  settle: string;
  bottom: string;
}

export interface EnhancedNegotiation {
  id?: string;
  user_id?: string;
  load_id?: string;
  original_offer: number;
  target_rate: number;
  anchor_rate: number;
  floor_rate: number;
  final_rate?: number;
  final_rpm?: number;
  strategy_used: string;
  outcome?: 'pending' | 'accepted' | 'counter_offered' | 'rejected';
  iterations: number;
  response_time_minutes?: number;
  message_sent?: string;
  notes?: string;
  channel?: 'text' | 'email' | 'phone';
  tone?: 'professional' | 'driver' | 'firm';
  negotiation_scripts?: UnifiedNegotiationScripts;
  rate_tier_accepted?: 'ask' | 'settle' | 'bottom' | 'other';
  created_at?: string;
  updated_at?: string;
}

export interface NegotiationAnalytics {
  total_negotiations: number;
  ask_acceptance_rate: number;
  settle_acceptance_rate: number;
  bottom_acceptance_rate: number;
  average_rpm_improvement: number;
  preferred_channel?: 'text' | 'email' | 'phone';
  preferred_tone?: 'professional' | 'driver' | 'firm';
}