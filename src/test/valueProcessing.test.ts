import { describe, it, expect } from 'vitest';
import { 
  processNumericValue, 
  processTextValue, 
  processFieldValue,
  validateCrossComponentConsistency 
} from '@/utils/valueProcessing';

describe('processNumericValue', () => {
  describe('Currency and formatting handling', () => {
    it('processes currency values correctly', () => {
      const result = processNumericValue('$1,405.24', 'rate');
      expect(result.isValid).toBe(true);
      expect(result.numericValue).toBe(1405.24);
      expect(result.cleanedValue).toBe('1405.24');
      expect(result.errors).toEqual([]);
    });

    it('handles commas in large numbers', () => {
      const result = processNumericValue('1,500', 'miles');
      expect(result.isValid).toBe(true);
      expect(result.numericValue).toBe(1500);
    });

    it('handles various currency symbols', () => {
      const testCases = [
        { input: '€1,234.56', expected: 1234.56 },
        { input: '£999.99', expected: 999.99 },
        { input: '¥1000', expected: 1000 },
        { input: '₹1,500.75', expected: 1500.75 }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = processNumericValue(input, 'rate');
        expect(result.isValid).toBe(true);
        expect(result.numericValue).toBe(expected);
      });
    });

    it('handles whitespace and mixed formatting', () => {
      const result = processNumericValue(' $ 1,405.24 ', 'rate');
      expect(result.isValid).toBe(true);
      expect(result.numericValue).toBe(1405.24);
    });

    it('handles percentage values', () => {
      const result = processNumericValue('85%', 'rate');
      expect(result.isValid).toBe(true);
      expect(result.numericValue).toBe(0.85);
    });
  });

  describe('Edge cases and error handling', () => {
    it('handles null and undefined values', () => {
      const result1 = processNumericValue(null as any, 'rate');
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Value is null, undefined, or not a string');

      const result2 = processNumericValue(undefined as any, 'rate');
      expect(result2.isValid).toBe(false);
    });

    it('handles empty strings', () => {
      const result = processNumericValue('', 'rate');
      expect(result.isValid).toBe(false);
    });

    it('handles invalid numeric formats', () => {
      const invalidValues = ['abc', '12.34.56', '$12a34', '1,2,3,4.5.6'];
      
      invalidValues.forEach(value => {
        const result = processNumericValue(value, 'rate');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('handles negative values', () => {
      const result = processNumericValue('-100.50', 'rate');
      expect(result.isValid).toBe(true);
      expect(result.numericValue).toBe(-100.50);
    });
  });

  describe('Range validation', () => {
    it('validates miles within reasonable range', () => {
      const validResult = processNumericValue('500', 'miles');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toEqual([]);

      const invalidResult = processNumericValue('10000', 'miles');
      expect(invalidResult.isValid).toBe(true); // Still valid, but with warning
      expect(invalidResult.errors).toContain('Miles should be between 0 and 5000, got 10000');
    });

    it('validates weight within reasonable range', () => {
      const validResult = processNumericValue('45000', 'weight');
      expect(validResult.isValid).toBe(true);

      const invalidResult = processNumericValue('100000', 'weight');
      expect(invalidResult.errors).toContain('Weight should be between 0 and 80,000 lbs, got 100000');
    });
  });

  describe('Processing steps tracking', () => {
    it('tracks all processing steps', () => {
      const result = processNumericValue('$1,405.24', 'rate');
      expect(result.processingSteps).toEqual([
        '✅ Step 1: Input validation passed',
        '✅ Step 2: Removed symbols → "1405.24"',
        '✅ Step 4: Numeric format validation passed',
        '✅ Step 5: parseFloat successful → 1405.24',
        '✅ Step 6: Range validation passed',
        '🎉 Final result: "1405.24" → 1405.24'
      ]);
    });
  });
});

describe('processTextValue', () => {
  it('processes location values correctly', () => {
    const result = processTextValue('  New York, NY  ', 'origin');
    expect(result.cleanedValue).toBe('New York, NY');
    expect(result.isValid).toBe(true);
  });

  it('validates location length', () => {
    const shortResult = processTextValue('A', 'origin');
    expect(shortResult.isValid).toBe(false);

    const longResult = processTextValue('A'.repeat(101), 'destination');
    expect(longResult.isValid).toBe(false);
  });

  it('handles non-location text fields', () => {
    const result = processTextValue('Some notes here', 'notes');
    expect(result.cleanedValue).toBe('Some notes here');
    expect(result.isValid).toBe(true);
  });
});

describe('processFieldValue', () => {
  it('routes numeric fields to numeric processing', () => {
    const result = processFieldValue('rate', '$1,405.24');
    expect(result.processedValue).toBe(1405.24);
    expect(result.isValid).toBe(true);
  });

  it('routes text fields to text processing', () => {
    const result = processFieldValue('origin', 'Chicago, IL');
    expect(result.processedValue).toBe('Chicago, IL');
    expect(result.isValid).toBe(true);
  });

  it('provides debug information', () => {
    const result = processFieldValue('rate', '$1,000');
    expect(result.debugInfo).toBeDefined();
    expect(result.debugInfo.length).toBeGreaterThan(0);
  });
});

describe('validateCrossComponentConsistency', () => {
  it('detects consistent values across components', () => {
    const ocrResult = { rate: '1405.24', miles: '500' };
    const formValues = { rate: '1405.24', miles: '500' };
    
    const result = validateCrossComponentConsistency(ocrResult, formValues, 'TestComponent');
    expect(result.isConsistent).toBe(true);
    expect(result.discrepancies).toEqual([]);
  });

  it('detects discrepancies between components', () => {
    const ocrResult = { rate: '1405.24', miles: '500' };
    const formValues = { rate: '1', miles: '500' }; // Rate discrepancy
    
    const result = validateCrossComponentConsistency(ocrResult, formValues, 'TestComponent');
    expect(result.isConsistent).toBe(false);
    expect(result.discrepancies).toContain('rate: OCR=1405.24, Form=1');
  });

  it('handles missing values gracefully', () => {
    const ocrResult = { rate: '1405.24' };
    const formValues = { miles: '500' };
    
    const result = validateCrossComponentConsistency(ocrResult, formValues, 'TestComponent');
    expect(result.isConsistent).toBe(true); // No common fields to compare
  });
});

describe('Real-world OCR scenarios', () => {
  it('handles common OCR extraction patterns', () => {
    const testCases = [
      // Common formats from load boards
      { input: 'RATE: $1,405.24', field: 'rate', expected: 1405.24 },
      { input: 'Miles: 500', field: 'miles', expected: 500 },
      { input: 'Weight: 45,000 lbs', field: 'weight', expected: 45000 },
      { input: 'FSC $125.50', field: 'fsc', expected: 125.50 },
      { input: 'Tolls: $45', field: 'tolls', expected: 45 },
      { input: 'DH: 25 mi', field: 'deadhead', expected: 25 },
      
      // Edge cases from real OCR
      { input: '$1 ,405.24', field: 'rate', expected: 1405.24 }, // Space after $
      { input: '1405 .24', field: 'rate', expected: 1405.24 }, // Space before decimal
      { input: '$1405. 24', field: 'rate', expected: 1405.24 }, // Space after decimal
    ];

    testCases.forEach(({ input, field, expected }) => {
      const result = processNumericValue(input, field);
      expect(result.isValid).toBe(true);
      expect(result.numericValue).toBe(expected);
    });
  });

  it('handles problematic OCR extractions', () => {
    const problematicCases = [
      // OCR might read 'O' as '0' or 'I' as '1'
      { input: '$I,4O5.24', field: 'rate' }, // Should fail validation
      { input: '$1,4o5.24', field: 'rate' }, // Should fail validation
      { input: 'Rate: N/A', field: 'rate' }, // Should fail validation
      { input: 'TBD', field: 'miles' }, // Should fail validation
      { input: '$1,405.ZH', field: 'rate' }, // Should fail validation
    ];

    problematicCases.forEach(({ input, field }) => {
      const result = processNumericValue(input, field);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});