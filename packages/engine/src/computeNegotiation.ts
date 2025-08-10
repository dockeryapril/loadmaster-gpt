import { LoadData, NegotiationSettings, UserSettings, NegotiationCalculation } from './types.js';

export function computeNegotiation(
  load: LoadData,
  userSettings: UserSettings,
  negotiationSettings: NegotiationSettings,
  laneBaselineRpm?: number
): NegotiationCalculation | null {
  if (!load.miles || !load.rate) {
    return null;
  }

  // Start with base RPM from user's excellent threshold
  let baseRpm = userSettings.rpmThresholds.excellent;
  
  // Use lane baseline if available and higher than user threshold
  if (laneBaselineRpm && laneBaselineRpm > baseRpm) {
    baseRpm = laneBaselineRpm;
  }

  // Calculate base rate from RPM
  let targetRate = baseRpm * load.miles;
  const premiumsApplied: string[] = [];

  // Apply premiums based on load characteristics and settings
  
  // Rush premium (pickup within threshold hours)
  if (negotiationSettings.rush_enabled) {
    // For demo, assume rush if no specific pickup time provided
    const rushMultiplier = negotiationSettings.rush_method === 'percentage' 
      ? 1 + (negotiationSettings.rush_value / 100)
      : negotiationSettings.rush_value;
    
    if (negotiationSettings.rush_method === 'percentage') {
      targetRate *= rushMultiplier;
    } else {
      targetRate += rushMultiplier * load.miles;
    }
    premiumsApplied.push(`Rush (+${negotiationSettings.rush_value}${negotiationSettings.rush_method === 'percentage' ? '%' : '/mile'})`);
  }

  // Weekend premium (basic check for weekend)
  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
  if (negotiationSettings.weekend_enabled && isWeekend) {
    const weekendMultiplier = negotiationSettings.weekend_method === 'percentage'
      ? 1 + (negotiationSettings.weekend_value / 100)
      : negotiationSettings.weekend_value;
    
    if (negotiationSettings.weekend_method === 'percentage') {
      targetRate *= weekendMultiplier;
    } else {
      targetRate += weekendMultiplier * load.miles;
    }
    premiumsApplied.push(`Weekend (+${negotiationSettings.weekend_value}${negotiationSettings.weekend_method === 'percentage' ? '%' : '/mile'})`);
  }

  // Heavy load adjustment
  if (negotiationSettings.heavy_enabled && load.weight && load.weight > negotiationSettings.heavy_weight_threshold) {
    const heavyMultiplier = negotiationSettings.heavy_method === 'percentage'
      ? 1 + (negotiationSettings.heavy_value / 100)
      : negotiationSettings.heavy_value;
    
    if (negotiationSettings.heavy_method === 'percentage') {
      targetRate *= heavyMultiplier;
    } else {
      targetRate += heavyMultiplier * load.miles;
    }
    premiumsApplied.push(`Heavy Load (${negotiationSettings.heavy_value}${negotiationSettings.heavy_method === 'percentage' ? '%' : '/mile'})`);
  }

  // Multi-stop premium (if notes contain "stop" - basic detection)
  if (negotiationSettings.multi_stop_enabled && load.notes?.toLowerCase().includes('stop')) {
    if (negotiationSettings.multi_stop_method === 'percentage') {
      targetRate *= 1 + (negotiationSettings.multi_stop_value / 100);
    } else {
      targetRate += negotiationSettings.multi_stop_value; // Flat fee for multi-stop
    }
    premiumsApplied.push(`Multi-Stop (+${negotiationSettings.multi_stop_value}${negotiationSettings.multi_stop_method === 'percentage' ? '%' : ' flat'})`);
  }

  // Premium freight (if notes contain "premium" - basic detection)
  if (negotiationSettings.premium_freight_enabled && load.notes?.toLowerCase().includes('premium')) {
    const premiumMultiplier = negotiationSettings.premium_freight_method === 'percentage'
      ? 1 + (negotiationSettings.premium_freight_value / 100)
      : negotiationSettings.premium_freight_value;
    
    if (negotiationSettings.premium_freight_method === 'percentage') {
      targetRate *= premiumMultiplier;
    } else {
      targetRate += premiumMultiplier * load.miles;
    }
    premiumsApplied.push(`Premium Freight (+${negotiationSettings.premium_freight_value}${negotiationSettings.premium_freight_method === 'percentage' ? '%' : '/mile'})`);
  }

  // Calculate anchor (opening bid) and floor rates
  const anchorRate = targetRate * (1 + negotiationSettings.anchor_offset);
  const floorRate = targetRate * (1 - negotiationSettings.floor_offset);

  // Determine suggested strategy
  let suggestedStrategy = 'standard';
  if (premiumsApplied.some(p => p.includes('Rush'))) suggestedStrategy = 'rush';
  else if (premiumsApplied.some(p => p.includes('Weekend'))) suggestedStrategy = 'weekend';
  else if (premiumsApplied.some(p => p.includes('Heavy'))) suggestedStrategy = 'heavy';
  else if (premiumsApplied.some(p => p.includes('Premium'))) suggestedStrategy = 'premium';
  else if (premiumsApplied.some(p => p.includes('Multi'))) suggestedStrategy = 'multi_stop';

  return {
    anchor_rate: Math.round(anchorRate),
    target_rate: Math.round(targetRate),
    floor_rate: Math.round(floorRate),
    base_rpm: baseRpm,
    premiums_applied: premiumsApplied,
    lane_baseline_rpm: laneBaselineRpm,
    suggested_strategy: suggestedStrategy,
  };
}