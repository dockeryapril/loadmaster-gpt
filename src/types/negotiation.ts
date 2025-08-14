export type FlatbedTemplateId =
  | 't_tarp'
  | 't_heavy'
  | 't_oversize'
  | 't_multistop'
  | 't_rush'
  | 't_securement'
  | 't_anchor';

export interface NegotiationSettings {
  id: string;
  user_id: string;
  
  // Premium settings with flexible method
  rush_enabled: boolean;
  rush_method: 'fixed' | 'percentage';
  rush_value: number;
  
  weekend_enabled: boolean;
  weekend_method: 'fixed' | 'percentage';
  weekend_value: number;
  
  heavy_enabled: boolean;
  heavy_method: 'fixed' | 'percentage';
  heavy_value: number;
  
  multi_stop_enabled: boolean;
  multi_stop_method: 'fixed' | 'percentage';
  multi_stop_value: number;
  
  premium_freight_enabled: boolean;
  premium_freight_method: 'fixed' | 'percentage';
  premium_freight_value: number;
  
  // Strategy settings
  anchor_offset: number;
  floor_offset: number;
  rush_threshold_hours: number;
  heavy_weight_threshold: number;
  
  created_at: string;
  updated_at: string;
}

export interface Negotiation {
  id: string;
  user_id: string;
  load_id: string;
  
  // Negotiation details
  original_offer: number;
  target_rate: number;
  anchor_rate: number;
  floor_rate: number;
  final_rate?: number;
  
  // Strategy and outcome
  strategy_used: 'standard' | 'rush' | 'weekend' | 'heavy' | 'premium' | 'multi_stop' | 'custom';
  outcome?: 'accepted' | 'counter_offered' | 'rejected' | 'pending';
  iterations: number;
  response_time_minutes?: number;
  
  // Message and notes
  message_sent?: string;
  notes?: string;
  
  created_at: string;
  updated_at: string;
}

export interface LaneHistory {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  avg_rpm: number;
  load_count: number;
  total_miles: number;
  total_revenue: number;
  created_at: string;
  last_updated: string;
}

export interface NegotiationCalculation {
  anchor_rate: number;
  target_rate: number;
  floor_rate: number;
  base_rpm: number;
  premiums_applied: string[];
  lane_baseline_rpm?: number;
  suggested_strategy: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  strategy: Negotiation['strategy_used'];
  template: string;
}

export const DEFAULT_NEGOTIATION_SETTINGS: Partial<NegotiationSettings> = {
  rush_enabled: true,
  rush_method: 'fixed',
  rush_value: 0.15,
  
  weekend_enabled: true,
  weekend_method: 'fixed',
  weekend_value: 0.10,
  
  heavy_enabled: true,
  heavy_method: 'fixed',
  heavy_value: -0.05,
  
  multi_stop_enabled: true,
  multi_stop_method: 'fixed',
  multi_stop_value: 25.00,
  
  premium_freight_enabled: true,
  premium_freight_method: 'percentage',
  premium_freight_value: 10.0,
  
  anchor_offset: 0.30,
  floor_offset: 0.15,
  rush_threshold_hours: 24,
  heavy_weight_threshold: 45000,
};

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'standard',
    name: 'Standard',
    strategy: 'standard',
    template: `Hi! I have availability for your load from {origin} to {destination}. 

Based on current market conditions and the {miles} miles, I can move this for {anchor_rate}/mile all-in. This rate reflects fuel costs, equipment positioning, and service quality.

Let me know if this works for your timeline. I can be loaded {pickup_date} and deliver on schedule.

Best regards`
  },
  {
    id: 'rush',
    name: 'Rush',
    strategy: 'rush',
    template: `Hi! I can accommodate your RUSH load from {origin} to {destination} picking up {pickup_date}.

Given the tight timeline and expedited service required, my rate is {anchor_rate}/mile all-in. This includes priority scheduling and dedicated equipment to meet your delivery requirements.

I can be loaded immediately and will prioritize this shipment. Please confirm if this rate works.

Thanks`
  },
  {
    id: 'weekend',
    name: 'Weekend',
    strategy: 'weekend',
    template: `Hello! I have weekend availability for your {origin} to {destination} shipment.

For weekend pickup/delivery service, my rate is {anchor_rate}/mile all-in. This premium accounts for weekend operations and ensures your freight moves when others can't.

I can accommodate your {pickup_date} schedule. Please let me know if this works.

Best`
  },
  {
    id: 'heavy',
    name: 'Heavy',
    strategy: 'heavy',
    template: `Hi! I can handle your heavy shipment from {origin} to {destination} - {weight} lbs.

My specialized heavy haul rate is {anchor_rate}/mile all-in. This includes proper permits, routing, and experienced handling for your heavy freight.

Equipment is ready and I can accommodate your timeline. Please confirm if this rate works.

Thank you`
  },
  {
    id: 'premium',
    name: 'Premium',
    strategy: 'premium',
    template: `Hello! I provide premium service for your {origin} to {destination} shipment.

My rate is {anchor_rate}/mile all-in, which includes white glove service, real-time tracking, dedicated equipment, and guaranteed on-time delivery.

I maintain 99% on-time delivery and provide premium service standards. Let me know if this meets your requirements.

Best regards`
  },
  {
    id: 'multi_stop',
    name: 'Multi-Stop',
    strategy: 'multi_stop',
    template: `Hi! I can handle your multi-stop shipment from {origin} to {destination} with the additional stops.

My rate is {anchor_rate}/mile plus {multi_stop_premium} per additional stop all-in. This accounts for extra handling, time, and coordination required for multiple pickups/deliveries.

I have experience with complex routing and can ensure all stops are serviced efficiently. Please confirm if this works.

Thanks`
  },
  {
    id: 'custom',
    name: 'Custom',
    strategy: 'custom',
    template: `Hi! I'm interested in your load from {origin} to {destination}.

My rate is {anchor_rate}/mile all-in. [Add your custom message here]

Please let me know if this rate works for your timeline.

Best regards`
  }
];