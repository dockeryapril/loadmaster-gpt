export interface NegotiationCalculation {
  anchor_rate: number;
  target_rate: number;
  floor_rate: number;
  base_rpm: number;
  premiums_applied: string[];
  lane_baseline_rpm?: number;
  suggested_strategy: string;
}

export interface LoadData {
  miles: number;
  rate: number;
  weight?: number;
  notes?: string;
}

export interface NegotiationSettings {
  rush_enabled: boolean;
  rush_value: number;
  rush_method: 'percentage' | 'fixed';
  rush_threshold_hours: number;
  weekend_enabled: boolean;
  weekend_value: number;
  weekend_method: 'percentage' | 'fixed';
  heavy_enabled: boolean;
  heavy_value: number;
  heavy_method: 'percentage' | 'fixed';
  heavy_weight_threshold: number;
  multi_stop_enabled: boolean;
  multi_stop_value: number;
  multi_stop_method: 'percentage' | 'fixed';
  premium_freight_enabled: boolean;
  premium_freight_value: number;
  premium_freight_method: 'percentage' | 'fixed';
  anchor_offset: number;
  floor_offset: number;
}

export interface UserSettings {
  rpmThresholds: {
    excellent: number;
    good: number;
    fair: number;
  };
}

export interface MessageTemplate {
  strategy: string;
  subject: string;
  message: string;
}

export const DEFAULT_NEGOTIATION_SETTINGS: NegotiationSettings = {
  rush_enabled: true,
  rush_value: 0.15,
  rush_method: 'fixed',
  rush_threshold_hours: 24,
  weekend_enabled: true,
  weekend_value: 0.10,
  weekend_method: 'fixed',
  heavy_enabled: true,
  heavy_value: -0.05,
  heavy_method: 'fixed',
  heavy_weight_threshold: 45000,
  multi_stop_enabled: true,
  multi_stop_value: 25.00,
  multi_stop_method: 'fixed',
  premium_freight_enabled: true,
  premium_freight_value: 10.0,
  premium_freight_method: 'percentage',
  anchor_offset: 0.30,
  floor_offset: 0.15,
};

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    strategy: 'standard',
    subject: 'Load Inquiry - {origin} to {destination}',
    message: 'Hi, I\'m interested in the load from {origin} to {destination} ({miles} miles). My rate is ${anchor_rate}. Please let me know if this works. Thanks!'
  },
  {
    strategy: 'rush',
    subject: 'Rush Load - {origin} to {destination}',
    message: 'Hi, I can handle this rush load from {origin} to {destination} ({miles} miles). Given the tight timeline, my rate is ${anchor_rate}. I can pick up immediately. Thanks!'
  },
  {
    strategy: 'weekend',
    subject: 'Weekend Load - {origin} to {destination}',
    message: 'Hi, I\'m available for the weekend load from {origin} to {destination} ({miles} miles). My weekend rate is ${anchor_rate}. Thanks!'
  },
  {
    strategy: 'heavy',
    subject: 'Heavy Load - {origin} to {destination}',
    message: 'Hi, I can handle the heavy load from {origin} to {destination} ({miles} miles, {weight} lbs). My rate for this load is ${anchor_rate}. Thanks!'
  },
  {
    strategy: 'premium',
    subject: 'Premium Freight - {origin} to {destination}',
    message: 'Hi, I\'m interested in the premium freight from {origin} to {destination} ({miles} miles). My rate for this specialized load is ${anchor_rate}. Thanks!'
  },
  {
    strategy: 'multi_stop',
    subject: 'Multi-Stop Load - {origin} to {destination}',
    message: 'Hi, I can handle the multi-stop load from {origin} to {destination} ({miles} miles). My rate including all stops is ${anchor_rate}. Thanks!'
  }
];