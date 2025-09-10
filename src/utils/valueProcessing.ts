/**
 * Unified Value Processing Utility
 * 
 * This utility provides consistent value processing across all OCR data transfer operations.
 * It handles currency symbols, commas, whitespace, and validation to ensure reliable
 * data extraction and display.
 */

export interface ProcessedValue {
  originalValue: string;
  cleanedValue: string;
  numericValue: number;
  isValid: boolean;
  errors: string[];
  processingSteps: string[];
}

/**
 * Processes and validates numeric field values from OCR/LLM extraction
 * @param value - The raw value from OCR extraction
 * @param fieldName - Name of the field for debugging
 * @returns ProcessedValue with cleaning results and validation status
 */
export function processNumericValue(value: string, fieldName: string): ProcessedValue {
  const result: ProcessedValue = {
    originalValue: value,
    cleanedValue: '',
    numericValue: 0,
    isValid: false,
    errors: [],
    processingSteps: []
  };

  console.log(`🔍 VALUE PROCESSING - Processing ${fieldName}: "${value}"`);
  
  try {
    // Step 1: Handle null/undefined/empty values
    if (!value || typeof value !== 'string') {
      result.errors.push('Value is null, undefined, or not a string');
      result.processingSteps.push('❌ Failed: Invalid input type');
      return result;
    }
    result.processingSteps.push('✅ Step 1: Input validation passed');

    // Step 2: Remove currency symbols, commas, and whitespace
    let cleaned = value.replace(/[$,\s€£¥₹]/g, '');
    result.processingSteps.push(`✅ Step 2: Removed symbols → "${cleaned}"`);

    // Step 3: Handle percentage signs (convert to decimal)
    if (cleaned.includes('%')) {
      cleaned = cleaned.replace('%', '');
      const percentValue = parseFloat(cleaned);
      if (!isNaN(percentValue)) {
        cleaned = (percentValue / 100).toString();
        result.processingSteps.push(`✅ Step 3: Converted percentage → "${cleaned}"`);
      }
    }

    // Step 4: Validate numeric format
    const numericRegex = /^-?\d*\.?\d+$/;
    if (!numericRegex.test(cleaned)) {
      result.errors.push(`Value "${cleaned}" is not a valid numeric format`);
      result.processingSteps.push('❌ Step 4: Failed numeric format validation');
      return result;
    }
    result.processingSteps.push('✅ Step 4: Numeric format validation passed');

    // Step 5: Parse to float
    const numValue = parseFloat(cleaned);
    if (isNaN(numValue)) {
      result.errors.push(`parseFloat failed for value "${cleaned}"`);
      result.processingSteps.push('❌ Step 5: parseFloat failed');
      return result;
    }
    result.processingSteps.push(`✅ Step 5: parseFloat successful → ${numValue}`);

    // Step 6: Range validation for specific fields
    const rangeValidation = validateRange(numValue, fieldName);
    if (!rangeValidation.isValid) {
      result.errors.push(rangeValidation.error);
      result.processingSteps.push(`⚠️ Step 6: Range validation warning: ${rangeValidation.error}`);
      // Don't return here - allow out-of-range values but warn
    } else {
      result.processingSteps.push('✅ Step 6: Range validation passed');
    }

    // Success
    result.cleanedValue = cleaned;
    result.numericValue = numValue;
    result.isValid = true;
    result.processingSteps.push(`🎉 Final result: "${result.cleanedValue}" → ${result.numericValue}`);

    console.log(`✅ VALUE PROCESSING - Success for ${fieldName}:`, result);
    return result;

  } catch (error) {
    result.errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.processingSteps.push(`❌ Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`❌ VALUE PROCESSING - Error for ${fieldName}:`, error, result);
    return result;
  }
}

/**
 * Validates numeric values are within reasonable ranges for trucking fields
 */
function validateRange(value: number, fieldName: string): { isValid: boolean; error?: string } {
  const validationRules: Record<string, { min: number; max: number; description: string }> = {
    'miles': { min: 0, max: 5000, description: 'Miles should be between 0 and 5000' },
    'rate': { min: 0, max: 50000, description: 'Rate should be between $0 and $50,000' },
    'weight': { min: 0, max: 80000, description: 'Weight should be between 0 and 80,000 lbs' },
    'deadhead': { min: 0, max: 1000, description: 'Deadhead miles should be between 0 and 1000' },
    'fsc': { min: 0, max: 10000, description: 'FSC should be between $0 and $10,000' },
    'tolls': { min: 0, max: 1000, description: 'Tolls should be between $0 and $1,000' },
    'fuelCost': { min: 0, max: 5000, description: 'Fuel cost should be between $0 and $5,000' }
  };

  const rule = validationRules[fieldName];
  if (!rule) {
    return { isValid: true }; // No validation rule for this field
  }

  if (value < rule.min || value > rule.max) {
    return { 
      isValid: false, 
      error: `${rule.description}, got ${value}` 
    };
  }

  return { isValid: true };
}

/**
 * Processes text field values (non-numeric)
 */
export function processTextValue(value: string, fieldName: string): { cleanedValue: string; isValid: boolean } {
  console.log(`🔍 TEXT PROCESSING - Processing ${fieldName}: "${value}"`);
  
  if (!value || typeof value !== 'string') {
    return { cleanedValue: '', isValid: false };
  }

  // Basic cleaning - trim whitespace and normalize
  const cleaned = value.trim().replace(/\s+/g, ' ');
  
  // Basic validation for location fields
  if (['origin', 'destination'].includes(fieldName)) {
    const isValid = cleaned.length >= 2 && cleaned.length <= 100;
    console.log(`✅ TEXT PROCESSING - ${fieldName}: "${cleaned}" (valid: ${isValid})`);
    return { cleanedValue: cleaned, isValid };
  }

  console.log(`✅ TEXT PROCESSING - ${fieldName}: "${cleaned}"`);
  return { cleanedValue: cleaned, isValid: true };
}

/**
 * Unified field processing that handles both numeric and text fields
 */
export function processFieldValue(fieldName: string, fieldValue: string): {
  processedValue: string | number;
  isValid: boolean;
  errors: string[];
  debugInfo: string[];
} {
  const numericFields = ['miles', 'rate', 'deadhead', 'weight', 'fsc', 'tolls', 'fuelCost'];
  
  if (numericFields.includes(fieldName)) {
    const result = processNumericValue(fieldValue, fieldName);
    return {
      processedValue: result.isValid ? result.numericValue : fieldValue,
      isValid: result.isValid,
      errors: result.errors,
      debugInfo: result.processingSteps
    };
  } else {
    const result = processTextValue(fieldValue, fieldName);
    return {
      processedValue: result.cleanedValue,
      isValid: result.isValid,
      errors: result.isValid ? [] : [`Invalid text value for ${fieldName}`],
      debugInfo: [`Text processing: "${fieldValue}" → "${result.cleanedValue}"`]
    };
  }
}

/**
 * Validates that extracted values match displayed values across components
 */
export function validateCrossComponentConsistency(
  ocrResult: any,
  formValues: Record<string, any>,
  componentName: string
): { isConsistent: boolean; discrepancies: string[] } {
  const discrepancies: string[] = [];
  
  console.log(`🔍 CONSISTENCY CHECK - ${componentName}:`, { ocrResult, formValues });
  
  // Check each numeric field for consistency
  const numericFields = ['miles', 'rate', 'weight'];
  
  numericFields.forEach(field => {
    const ocrValue = ocrResult[field];
    const formValue = formValues[field];
    
    if (ocrValue && formValue) {
      const ocrProcessed = processNumericValue(ocrValue.toString(), field);
      const formProcessed = processNumericValue(formValue.toString(), field);
      
      if (ocrProcessed.isValid && formProcessed.isValid) {
        if (Math.abs(ocrProcessed.numericValue - formProcessed.numericValue) > 0.01) {
          discrepancies.push(
            `${field}: OCR=${ocrProcessed.numericValue}, Form=${formProcessed.numericValue}`
          );
        }
      }
    }
  });
  
  const isConsistent = discrepancies.length === 0;
  
  if (!isConsistent) {
    console.warn(`⚠️ CONSISTENCY CHECK - Discrepancies in ${componentName}:`, discrepancies);
  } else {
    console.log(`✅ CONSISTENCY CHECK - ${componentName} is consistent`);
  }
  
  return { isConsistent, discrepancies };
}