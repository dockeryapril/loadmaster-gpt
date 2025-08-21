/**
 * Comprehensive input validation utility for security and data integrity
 */

// Maximum allowed values for security
export const VALIDATION_LIMITS = {
  // Geographic limits
  MILES_MAX: 3500,
  DEADHEAD_MAX: 1000,
  
  // Financial limits
  RATE_MAX: 50000,
  FSC_MAX: 5000,
  TOLLS_MAX: 2000,
  FUEL_COST_MAX: 10000,
  FUEL_PRICE_MAX: 20,
  
  // Physical limits
  WEIGHT_MAX: 150000,
  WEIGHT_LIMIT_MAX: 120000,
  MPG_MAX: 15,
  MPG_MIN: 3,
  
  // RPM thresholds
  RPM_MAX: 10,
  RPM_MIN: 0.1,
  
  // Time limits
  RUSH_THRESHOLD_MAX: 168, // 1 week in hours
  
  // Percentage limits
  PERCENTAGE_MIN: -100,
  PERCENTAGE_MAX: 500,
  
  // Text limits
  TEXT_MAX_LENGTH: 1000,
  LOCATION_MAX_LENGTH: 100,
} as const;

// Sanitize text input to prevent XSS and injection
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, VALIDATION_LIMITS.TEXT_MAX_LENGTH)
    .replace(/[<>'"&]/g, ''); // Remove potentially dangerous characters
}

// Sanitize location input (city, state format)
export function sanitizeLocation(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, VALIDATION_LIMITS.LOCATION_MAX_LENGTH)
    .replace(/[<>'"&]/g, '') // Remove dangerous chars
    .replace(/[^a-zA-Z0-9\s,.-]/g, ''); // Allow only alphanumeric, spaces, comma, period, dash
}

// Validate and sanitize numeric input
export function validateNumeric(
  value: string | number,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
  allowZero: boolean = true
): { isValid: boolean; value: number; error?: string } {
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if it's a valid number
  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, value: 0, error: 'Must be a valid number' };
  }
  
  // Check zero constraint
  if (!allowZero && num === 0) {
    return { isValid: false, value: 0, error: 'Must be greater than 0' };
  }
  
  // Check minimum
  if (num < min) {
    return { isValid: false, value: 0, error: `Must be at least ${min}` };
  }
  
  // Check maximum
  if (num > max) {
    return { isValid: false, value: 0, error: `Cannot exceed ${max}` };
  }
  
  return { isValid: true, value: num };
}

// Validate miles input
export function validateMiles(value: string): { isValid: boolean; error?: string } {
  const result = validateNumeric(value, 1, VALIDATION_LIMITS.MILES_MAX, false);
  return { isValid: result.isValid, error: result.error };
}

// Validate rate input
export function validateRate(value: string): { isValid: boolean; error?: string } {
  const result = validateNumeric(value, 1, VALIDATION_LIMITS.RATE_MAX, false);
  return { isValid: result.isValid, error: result.error };
}

// Validate deadhead miles
export function validateDeadhead(value: string): { isValid: boolean; error?: string } {
  if (!value) return { isValid: true }; // Optional field
  const result = validateNumeric(value, 0, VALIDATION_LIMITS.DEADHEAD_MAX, true);
  return { isValid: result.isValid, error: result.error };
}

// Validate weight input
export function validateWeight(value: string): { isValid: boolean; error?: string } {
  if (!value) return { isValid: true }; // Optional field
  const result = validateNumeric(value, 1, VALIDATION_LIMITS.WEIGHT_MAX, false);
  return { isValid: result.isValid, error: result.error };
}

// Validate FSC input
export function validateFSC(value: string): { isValid: boolean; error?: string } {
  if (!value) return { isValid: true }; // Optional field
  const result = validateNumeric(value, 0, VALIDATION_LIMITS.FSC_MAX, true);
  return { isValid: result.isValid, error: result.error };
}

// Validate tolls input
export function validateTolls(value: string): { isValid: boolean; error?: string } {
  if (!value) return { isValid: true }; // Optional field
  const result = validateNumeric(value, 0, VALIDATION_LIMITS.TOLLS_MAX, true);
  return { isValid: result.isValid, error: result.error };
}

// Validate fuel cost input
export function validateFuelCost(value: string): { isValid: boolean; error?: string } {
  if (!value) return { isValid: true }; // Optional field
  const result = validateNumeric(value, 0, VALIDATION_LIMITS.FUEL_COST_MAX, true);
  return { isValid: result.isValid, error: result.error };
}

// Validate fuel price input
export function validateFuelPrice(value: string): { isValid: boolean; error?: string } {
  const result = validateNumeric(value, 0.1, VALIDATION_LIMITS.FUEL_PRICE_MAX, false);
  return { isValid: result.isValid, error: result.error };
}

// Validate MPG input
export function validateMPG(value: string): { isValid: boolean; error?: string } {
  const result = validateNumeric(value, VALIDATION_LIMITS.MPG_MIN, VALIDATION_LIMITS.MPG_MAX, false);
  return { isValid: result.isValid, error: result.error };
}

// Validate RPM threshold input
export function validateRPM(value: string): { isValid: boolean; error?: string } {
  const result = validateNumeric(value, VALIDATION_LIMITS.RPM_MIN, VALIDATION_LIMITS.RPM_MAX, false);
  return { isValid: result.isValid, error: result.error };
}

// Validate weight limit input
export function validateWeightLimit(value: string): { isValid: boolean; error?: string } {
  const result = validateNumeric(value, 1000, VALIDATION_LIMITS.WEIGHT_LIMIT_MAX, false);
  return { isValid: result.isValid, error: result.error };
}

// Validate percentage input
export function validatePercentage(value: string | number): { isValid: boolean; error?: string } {
  const result = validateNumeric(value, VALIDATION_LIMITS.PERCENTAGE_MIN, VALIDATION_LIMITS.PERCENTAGE_MAX, true);
  return { isValid: result.isValid, error: result.error };
}

// Validate location format (City, ST)
export function validateLocation(value: string): { isValid: boolean; error?: string } {
  if (!value) return { isValid: false, error: 'Location is required' };
  
  const sanitized = sanitizeLocation(value);
  
  // Basic format check: should contain a comma and be reasonable length
  const parts = sanitized.split(',');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Format: City, ST' };
  }
  
  const [city, state] = parts.map(p => p.trim());
  
  if (!city || city.length < 2) {
    return { isValid: false, error: 'City name too short' };
  }
  
  if (!state || state.length !== 2 || !/^[A-Z]{2}$/.test(state)) {
    return { isValid: false, error: 'State must be 2 letters (e.g., CA)' };
  }
  
  return { isValid: true };
}

// Validate rush threshold hours
export function validateRushThreshold(value: string | number): { isValid: boolean; error?: string } {
  const result = validateNumeric(value, 1, VALIDATION_LIMITS.RUSH_THRESHOLD_MAX, false);
  return { isValid: result.isValid, error: result.error };
}

// Rate limiting validation (extra security layer)
export function validateRequestFrequency(lastRequestTime: number, minIntervalMs: number = 1000): boolean {
  const now = Date.now();
  return (now - lastRequestTime) >= minIntervalMs;
}

// Comprehensive form validation
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateLoadForm(data: {
  origin: string;
  destination: string;
  miles: string;
  rate: string;
  fsc?: string;
  tolls?: string;
  weight?: string;
  deadheadMiles?: string;
  fuelCost?: string;
  notes?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate required fields
  const originValidation = validateLocation(data.origin);
  if (!originValidation.isValid) {
    errors.origin = originValidation.error!;
  }
  
  const destinationValidation = validateLocation(data.destination);
  if (!destinationValidation.isValid) {
    errors.destination = destinationValidation.error!;
  }
  
  const milesValidation = validateMiles(data.miles);
  if (!milesValidation.isValid) {
    errors.miles = milesValidation.error!;
  }
  
  const rateValidation = validateRate(data.rate);
  if (!rateValidation.isValid) {
    errors.rate = rateValidation.error!;
  }
  
  // Validate optional fields
  if (data.fsc) {
    const fscValidation = validateFSC(data.fsc);
    if (!fscValidation.isValid) {
      errors.fsc = fscValidation.error!;
    }
  }
  
  if (data.tolls) {
    const tollsValidation = validateTolls(data.tolls);
    if (!tollsValidation.isValid) {
      errors.tolls = tollsValidation.error!;
    }
  }
  
  if (data.weight) {
    const weightValidation = validateWeight(data.weight);
    if (!weightValidation.isValid) {
      errors.weight = weightValidation.error!;
    }
  }
  
  if (data.deadheadMiles) {
    const deadheadValidation = validateDeadhead(data.deadheadMiles);
    if (!deadheadValidation.isValid) {
      errors.deadheadMiles = deadheadValidation.error!;
    }
  }
  
  if (data.fuelCost) {
    const fuelCostValidation = validateFuelCost(data.fuelCost);
    if (!fuelCostValidation.isValid) {
      errors.fuelCost = fuelCostValidation.error!;
    }
  }
  
  // Sanitize notes
  if (data.notes) {
    // Just check length, sanitization happens elsewhere
    if (data.notes.length > VALIDATION_LIMITS.TEXT_MAX_LENGTH) {
      errors.notes = `Notes too long (max ${VALIDATION_LIMITS.TEXT_MAX_LENGTH} characters)`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}