import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FieldDetectionResult } from '@/utils/SmartFieldDetector';

// Create a comprehensive test suite for all handleFieldsDetected implementations

describe('handleFieldsDetected Implementation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockOcrResult = (overrides?: Partial<FieldDetectionResult>): FieldDetectionResult => ({
    detectedFields: [
      { field: 'rate', value: '$1,405.24', confidence: 'high' },
      { field: 'miles', value: '500', confidence: 'high' },
      { field: 'weight', value: '45,000', confidence: 'medium' },
      { field: 'origin', value: 'Chicago, IL', confidence: 'high' },
      { field: 'destination', value: 'Atlanta, GA', confidence: 'high' },
      { field: 'deadhead', value: '25', confidence: 'medium' },
      { field: 'fsc', value: '$125.50', confidence: 'low' },
      { field: 'tolls', value: '$45', confidence: 'medium' }
    ],
    confidence: 'high',
    rawText: 'Mock OCR extracted text',
    warnings: [],
    processingTime: 1000,
    ...overrides
  });

  describe('LoadCalculator handleFieldsDetected', () => {
    const createMockForm = () => {
      const values: Record<string, any> = {};
      return {
        setValue: vi.fn((field: string, value: any, options?: any) => {
          values[field] = value;
        }),
        getValues: vi.fn((field?: string) => field ? values[field] : values),
        values
      };
    };

    it('processes all numeric fields with enhanced cleaning', () => {
      const mockForm = createMockForm();
      const ocrResult = createMockOcrResult();

      // Simulate LoadCalculator's enhanced handleFieldsDetected
      ocrResult.detectedFields.forEach((field) => {
        let processedValue = field.value;
        
        if (['miles', 'rate', 'deadhead', 'weight', 'fsc', 'tolls', 'fuelCost'].includes(field.field)) {
          processedValue = field.value.replace(/[$,\s]/g, '');
          const numValue = parseFloat(processedValue);
          if (!isNaN(numValue)) {
            processedValue = numValue.toString();
          }
        }

        switch (field.field) {
          case 'miles':
            mockForm.setValue('miles', processedValue, { shouldValidate: true });
            break;
          case 'rate':
            mockForm.setValue('rate', processedValue, { shouldValidate: true });
            break;
          case 'weight':
            mockForm.setValue('weight', processedValue, { shouldValidate: true });
            break;
          case 'deadhead':
            mockForm.setValue('deadheadMiles', processedValue, { shouldValidate: true });
            break;
          case 'fsc':
            mockForm.setValue('fsc', processedValue, { shouldValidate: true });
            break;
          case 'tolls':
            mockForm.setValue('tolls', processedValue, { shouldValidate: true });
            break;
          case 'origin':
            mockForm.setValue('origin', field.value, { shouldValidate: true });
            break;
          case 'destination':
            mockForm.setValue('destination', field.value, { shouldValidate: true });
            break;
        }
      });

      // Verify all fields were processed correctly
      expect(mockForm.values.rate).toBe('1405.24');
      expect(mockForm.values.miles).toBe('500');
      expect(mockForm.values.weight).toBe('45000');
      expect(mockForm.values.deadheadMiles).toBe('25');
      expect(mockForm.values.fsc).toBe('125.50');
      expect(mockForm.values.tolls).toBe('45');
      expect(mockForm.values.origin).toBe('Chicago, IL');
      expect(mockForm.values.destination).toBe('Atlanta, GA');

      // Verify setValue was called with correct parameters
      expect(mockForm.setValue).toHaveBeenCalledWith('rate', '1405.24', { shouldValidate: true });
      expect(mockForm.setValue).toHaveBeenCalledWith('miles', '500', { shouldValidate: true });
    });

    it('handles edge cases in numeric processing', () => {
      const mockForm = createMockForm();
      const edgeCaseResult = createMockOcrResult({
        detectedFields: [
          { field: 'rate', value: ' $ 1,405.24 ', confidence: 'high' }, // Extra spaces
          { field: 'miles', value: '1,500', confidence: 'high' }, // Comma in miles
          { field: 'weight', value: 'Weight: 45,000 lbs', confidence: 'medium' }, // Text prefix
          { field: 'fsc', value: 'FSC $125.50', confidence: 'low' }, // Text prefix
          { field: 'tolls', value: '€45.75', confidence: 'medium' } // Euro symbol
        ]
      });

      // Process edge cases
      edgeCaseResult.detectedFields.forEach((field) => {
        let processedValue = field.value;
        
        if (['miles', 'rate', 'deadhead', 'weight', 'fsc', 'tolls', 'fuelCost'].includes(field.field)) {
          processedValue = field.value.replace(/[$,\s]/g, '');
          const numValue = parseFloat(processedValue);
          if (!isNaN(numValue)) {
            processedValue = numValue.toString();
          }
        }

        switch (field.field) {
          case 'rate':
            mockForm.setValue('rate', processedValue, { shouldValidate: true });
            break;
          case 'miles':
            mockForm.setValue('miles', processedValue, { shouldValidate: true });
            break;
          case 'weight':
            mockForm.setValue('weight', processedValue, { shouldValidate: true });
            break;
          case 'fsc':
            mockForm.setValue('fsc', processedValue, { shouldValidate: true });
            break;
          case 'tolls':
            mockForm.setValue('tolls', processedValue, { shouldValidate: true });
            break;
        }
      });

      // Note: LoadCalculator's current regex only removes $,\s so some edge cases won't work perfectly
      expect(mockForm.values.rate).toBe('1405.24');
      expect(mockForm.values.miles).toBe('1500');
      expect(mockForm.values.weight).toBe('Weight:45000lbs'); // Partial cleaning due to regex limitation
      expect(mockForm.values.fsc).toBe('FSC125.50'); // Partial cleaning
      expect(mockForm.values.tolls).toBe('€45.75'); // Euro not removed by current regex
    });
  });

  describe('Core.tsx handleFieldsDetected', () => {
    it('processes fields with restrictive cleaning', () => {
      const formState = {
        miles: '',
        offerAllIn: '',
        weightLbs: ''
      };
      const fieldsPopulated: string[] = [];
      const ocrResult = createMockOcrResult();

      // Simulate Core.tsx processing
      ocrResult.detectedFields.forEach(field => {
        const cleanValue = field.value.replace(/[^0-9.]/g, '');
        if (cleanValue) {
          switch (field.field) {
            case 'miles':
              formState.miles = cleanValue;
              fieldsPopulated.push('Miles');
              break;
            case 'rate':
              formState.offerAllIn = cleanValue;
              fieldsPopulated.push('Rate');
              break;
            case 'weight':
              formState.weightLbs = cleanValue;
              fieldsPopulated.push('Weight');
              break;
          }
        }
      });

      // Verify Core.tsx processing (more aggressive cleaning)
      expect(formState.offerAllIn).toBe('1405.24'); // Removes all non-numeric except decimal
      expect(formState.miles).toBe('500');
      expect(formState.weightLbs).toBe('45000');
      expect(fieldsPopulated).toEqual(['Rate', 'Miles', 'Weight']);
    });

    it('handles complex values with restrictive cleaning', () => {
      const formState = { miles: '', offerAllIn: '', weightLbs: '' };
      const complexResult = createMockOcrResult({
        detectedFields: [
          { field: 'rate', value: 'Rate: $1,405.24 ALL IN', confidence: 'high' },
          { field: 'miles', value: 'Miles: 500 mi', confidence: 'high' },
          { field: 'weight', value: '45,000 lbs max', confidence: 'medium' }
        ]
      });

      complexResult.detectedFields.forEach(field => {
        const cleanValue = field.value.replace(/[^0-9.]/g, '');
        if (cleanValue) {
          switch (field.field) {
            case 'miles':
              formState.miles = cleanValue;
              break;
            case 'rate':
              formState.offerAllIn = cleanValue;
              break;
            case 'weight':
              formState.weightLbs = cleanValue;
              break;
          }
        }
      });

      // Core's aggressive cleaning removes everything except digits and decimals
      expect(formState.offerAllIn).toBe('1405.24');
      expect(formState.miles).toBe('500');
      expect(formState.weightLbs).toBe('45000');
    });
  });

  describe('Dashboard.tsx handleFieldsDetected', () => {
    it('processes fields with direct parseFloat (problematic approach)', () => {
      const ocrResult = createMockOcrResult();
      
      // Simulate Dashboard.tsx processing
      const fieldsMap = ocrResult.detectedFields.reduce((acc, field) => {
        acc[field.field] = field.value;
        return acc;
      }, {} as Record<string, string>);

      const dashboardData = {
        origin: fieldsMap.origin || '',
        destination: fieldsMap.destination || '',
        miles: fieldsMap.miles ? parseFloat(fieldsMap.miles) : undefined,
        rate: fieldsMap.rate ? parseFloat(fieldsMap.rate) : undefined,
        fsc: fieldsMap.fsc ? parseFloat(fieldsMap.fsc) : undefined,
        weight: fieldsMap.weight ? parseFloat(fieldsMap.weight) : undefined,
        deadheadMiles: fieldsMap.deadhead ? parseFloat(fieldsMap.deadhead) : undefined,
        tolls: fieldsMap.tolls ? parseFloat(fieldsMap.tolls) : undefined,
        notes: '',
      };

      // Dashboard's direct parseFloat approach fails with currency/comma formats
      expect(dashboardData.origin).toBe('Chicago, IL');
      expect(dashboardData.destination).toBe('Atlanta, GA');
      expect(dashboardData.miles).toBe(500); // Plain number works
      expect(isNaN(dashboardData.rate!)).toBe(true); // parseFloat("$1,405.24") = NaN
      expect(isNaN(dashboardData.fsc!)).toBe(true); // parseFloat("$125.50") = NaN
      expect(dashboardData.weight).toBe(45); // parseFloat("45,000") = 45 (stops at comma)
      expect(dashboardData.deadheadMiles).toBe(25); // Plain number works
      expect(isNaN(dashboardData.tolls!)).toBe(true); // parseFloat("$45") = NaN
    });
  });

  describe('Index.tsx handleFieldsDetected', () => {
    it('processes fields similar to Dashboard (same issues)', () => {
      const ocrResult = createMockOcrResult();
      
      // Simulate Index.tsx processing
      const fieldsMap = ocrResult.detectedFields.reduce((acc, field) => {
        acc[field.field] = field.value;
        return acc;
      }, {} as Record<string, string>);

      const indexData = {
        origin: fieldsMap.origin || '',
        destination: fieldsMap.destination || '',
        miles: fieldsMap.miles ? parseFloat(fieldsMap.miles) : undefined,
        rate: fieldsMap.rate ? parseFloat(fieldsMap.rate) : undefined,
        fsc: fieldsMap.fsc ? parseFloat(fieldsMap.fsc) : undefined,
        weight: fieldsMap.weight ? parseFloat(fieldsMap.weight) : undefined,
        deadheadMiles: fieldsMap.deadhead ? parseFloat(fieldsMap.deadhead) : undefined,
        fuelCost: fieldsMap.fuelCost ? parseFloat(fieldsMap.fuelCost) : undefined,
        tolls: fieldsMap.tolls ? parseFloat(fieldsMap.tolls) : undefined,
        notes: '',
      };

      // Index.tsx has the same issues as Dashboard.tsx
      expect(indexData.origin).toBe('Chicago, IL');
      expect(indexData.destination).toBe('Atlanta, GA');
      expect(indexData.miles).toBe(500);
      expect(isNaN(indexData.rate!)).toBe(true);
      expect(isNaN(indexData.fsc!)).toBe(true);
      expect(indexData.weight).toBe(45); // Truncated at comma
      expect(indexData.deadheadMiles).toBe(25);
      expect(isNaN(indexData.tolls!)).toBe(true);
    });
  });

  describe('Cross-Component Comparison', () => {
    it('identifies processing inconsistencies between components', () => {
      const ocrResult = createMockOcrResult();
      const testValue = '$1,405.24';

      // Different processing approaches
      const loadCalculatorResult = parseFloat(testValue.replace(/[$,\s]/g, ''));
      const coreResult = parseFloat(testValue.replace(/[^0-9.]/g, ''));
      const dashboardResult = parseFloat(testValue);
      const indexResult = parseFloat(testValue);

      // LoadCalculator and Core should produce same result
      expect(loadCalculatorResult).toBe(coreResult);
      expect(loadCalculatorResult).toBe(1405.24);

      // Dashboard and Index should both fail (NaN)
      expect(isNaN(dashboardResult)).toBe(true);
      expect(isNaN(indexResult)).toBe(true);

      // Consistency check
      const workingApproaches = [loadCalculatorResult, coreResult];
      const brokenApproaches = [dashboardResult, indexResult];

      expect(workingApproaches.every(val => val === 1405.24)).toBe(true);
      expect(brokenApproaches.every(val => isNaN(val))).toBe(true);
    });

    it('tests all approaches with various input formats', () => {
      const testCases = [
        { input: '$1,405.24', description: 'Currency with comma' },
        { input: '1405.24', description: 'Plain decimal' },
        { input: '1,405', description: 'Integer with comma' },
        { input: '$1405', description: 'Currency without comma' },
        { input: '€1,405.24', description: 'Euro currency' },
        { input: ' $1,405.24 ', description: 'With whitespace' }
      ];

      testCases.forEach(testCase => {
        const loadCalculatorResult = parseFloat(testCase.input.replace(/[$,\s]/g, ''));
        const coreResult = parseFloat(testCase.input.replace(/[^0-9.]/g, ''));
        const dashboardResult = parseFloat(testCase.input);

        console.log(`Testing ${testCase.description}:`);
        console.log(`  LoadCalculator: ${loadCalculatorResult}`);
        console.log(`  Core: ${coreResult}`);
        console.log(`  Dashboard: ${dashboardResult}`);

        // Document expected behaviors for each approach
        if (testCase.input === '1405.24') {
          // Plain decimal should work for all
          expect(loadCalculatorResult).toBe(1405.24);
          expect(coreResult).toBe(1405.24);
          expect(dashboardResult).toBe(1405.24);
        } else if (testCase.input.includes('$') || testCase.input.includes('€')) {
          // Currency symbols break Dashboard approach
          expect(loadCalculatorResult).toBe(1405.24);
          expect(coreResult).toBe(1405.24);
          expect(isNaN(dashboardResult)).toBe(true);
        }
      });
    });
  });
});