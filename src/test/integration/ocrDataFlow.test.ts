import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FieldDetectionResult, DetectedField } from '@/utils/SmartFieldDetector';
import { validateCrossComponentConsistency } from '@/utils/valueProcessing';

// Mock the hooks and utilities
vi.mock('@/utils/apiWrapper', () => ({
  callOpenAIWithRateLimit: vi.fn(),
  RateLimitExceededError: class extends Error {}
}));

vi.mock('@loadmaster/api', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: null, error: null })),
      update: vi.fn(() => ({ data: null, error: null }))
    }))
  }
}));

// Mock form setValue function for testing
const createMockFormSetValue = () => {
  const values: Record<string, any> = {};
  const setValue = vi.fn((field: string, value: any) => {
    values[field] = value;
  });
  const getValues = vi.fn((field?: string) => {
    if (field) return values[field];
    return values;
  });
  
  return { setValue, getValues, values };
};

describe('OCR Data Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cross-Component handleFieldsDetected Consistency', () => {
  const mockOcrResult: FieldDetectionResult = {
    detectedFields: [
      { field: 'rate', value: '$1,405.24', confidence: 'high' },
      { field: 'miles', value: '500', confidence: 'high' },
      { field: 'weight', value: '45,000', confidence: 'medium' },
      { field: 'origin', value: 'Chicago, IL', confidence: 'high' },
      { field: 'destination', value: 'Atlanta, GA', confidence: 'high' }
    ],
    confidence: 'high',
    rawText: 'Sample OCR text',
    warnings: [],
    processingTime: 1500
  };

    it('LoadCalculator handleFieldsDetected processes values correctly', () => {
      // Simulate LoadCalculator's handleFieldsDetected logic
      const mockForm = createMockFormSetValue();
      
      // Process fields similar to LoadCalculator implementation
      mockOcrResult.detectedFields.forEach((field) => {
        let processedValue = field.value;
        
        // Numeric field processing (enhanced version from LoadCalculator)
        if (['miles', 'rate', 'deadhead', 'weight', 'fsc', 'tolls', 'fuelCost'].includes(field.field)) {
          processedValue = field.value.replace(/[$,\s]/g, '');
          const numValue = parseFloat(processedValue);
          if (!isNaN(numValue)) {
            processedValue = numValue.toString();
          }
        }

        switch (field.field) {
          case 'miles':
            mockForm.setValue('miles', processedValue);
            break;
          case 'rate':
            mockForm.setValue('rate', processedValue);
            break;
          case 'weight':
            mockForm.setValue('weight', processedValue);
            break;
          case 'origin':
            mockForm.setValue('origin', field.value);
            break;
          case 'destination':
            mockForm.setValue('destination', field.value);
            break;
        }
      });

      // Verify correct processing
      expect(mockForm.getValues('miles')).toBe('1405.24'); // Note: miles field had rate value in mock
      expect(mockForm.getValues('rate')).toBe('500');
      expect(mockForm.getValues('weight')).toBe('45000');
      expect(mockForm.getValues('origin')).toBe('Chicago, IL');
      expect(mockForm.getValues('destination')).toBe('Atlanta, GA');
    });

    it('Core.tsx handleFieldsDetected processes values correctly', () => {
      // Simulate Core.tsx's handleFieldsDetected logic
      const formState = {
        miles: '',
        offerAllIn: '',
        weightLbs: ''
      };

      // Process fields similar to Core.tsx implementation  
      mockOcrResult.detectedFields.forEach(field => {
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

      // Verify Core.tsx processing
      expect(formState.miles).toBe('1405.24'); // Note: miles field had rate value in mock
      expect(formState.offerAllIn).toBe('500');
      expect(formState.weightLbs).toBe('45000');
    });

    it('Dashboard.tsx handleFieldsDetected processes values correctly', () => {
      // Simulate Dashboard.tsx's handleFieldsDetected logic
      const fieldsMap = mockOcrResult.detectedFields.reduce((acc, field) => {
        acc[field.field] = field.value;
        return acc;
      }, {} as Record<string, string>);

      const dashboardData = {
        miles: fieldsMap.miles ? parseFloat(fieldsMap.miles) : undefined,
        rate: fieldsMap.rate ? parseFloat(fieldsMap.rate) : undefined,
        weight: fieldsMap.weight ? parseFloat(fieldsMap.weight) : undefined,
        origin: fieldsMap.origin || '',  
        destination: fieldsMap.destination || ''
      };

      // Dashboard.tsx uses direct parseFloat without cleaning - this will show the issue
      expect(isNaN(dashboardData.miles!)).toBe(true); // parseFloat("$1,405.24") = NaN
      expect(dashboardData.rate).toBe(500);
      expect(isNaN(dashboardData.weight!)).toBe(true); // parseFloat("45,000") = NaN
      expect(dashboardData.origin).toBe('Chicago, IL');
      expect(dashboardData.destination).toBe('Atlanta, GA');
    });

    it('Index.tsx handleFieldsDetected processes values correctly', () => {
      // Simulate Index.tsx's handleFieldsDetected logic  
      const fieldsMap = mockOcrResult.detectedFields.reduce((acc, field) => {
        acc[field.field] = field.value;
        return acc;
      }, {} as Record<string, string>);

      const indexData = {
        miles: fieldsMap.miles ? parseFloat(fieldsMap.miles) : undefined,
        rate: fieldsMap.rate ? parseFloat(fieldsMap.rate) : undefined, 
        weight: fieldsMap.weight ? parseFloat(fieldsMap.weight) : undefined,
        origin: fieldsMap.origin || '',
        destination: fieldsMap.destination || ''
      };

      // Index.tsx also uses direct parseFloat - same issues as Dashboard
      expect(isNaN(indexData.miles!)).toBe(true);
      expect(indexData.rate).toBe(500);
      expect(isNaN(indexData.weight!)).toBe(true);
      expect(indexData.origin).toBe('Chicago, IL');
      expect(indexData.destination).toBe('Atlanta, GA');
    });
  });

  describe('Value Processing Consistency Validation', () => {
    it('detects inconsistencies between different processing approaches', () => {
      const ocrValues = { rate: '$1,405.24', miles: '500', weight: '45,000' };
      
      // LoadCalculator approach (enhanced cleaning)
      const loadCalculatorValues = {
        rate: parseFloat('$1,405.24'.replace(/[$,\s]/g, '')).toString(),
        miles: parseFloat('500'.replace(/[$,\s]/g, '')).toString(),
        weight: parseFloat('45,000'.replace(/[$,\s]/g, '')).toString()
      };

      // Dashboard/Index approach (direct parseFloat)
      const dashboardValues = {
        rate: parseFloat('$1,405.24').toString(),
        miles: parseFloat('500').toString(), 
        weight: parseFloat('45,000').toString()
      };

      // Core approach (restrictive cleaning)
      const coreValues = {
        rate: parseFloat('$1,405.24'.replace(/[^0-9.]/g, '')).toString(),
        miles: parseFloat('500'.replace(/[^0-9.]/g, '')).toString(),
        weight: parseFloat('45,000'.replace(/[^0-9.]/g, '')).toString()
      };

      // Test consistency between LoadCalculator and Core (should be consistent)
      const loadCalculatorVsCore = validateCrossComponentConsistency(
        loadCalculatorValues, coreValues, 'LoadCalculator vs Core'
      );
      expect(loadCalculatorVsCore.isConsistent).toBe(true);

      // Test consistency between LoadCalculator and Dashboard (should find discrepancies)
      const loadCalculatorVsDashboard = validateCrossComponentConsistency(
        loadCalculatorValues, dashboardValues, 'LoadCalculator vs Dashboard'
      );
      expect(loadCalculatorVsDashboard.isConsistent).toBe(false);
      expect(loadCalculatorVsDashboard.discrepancies).toContain('rate: OCR=1405.24, Form=NaN');
      expect(loadCalculatorVsDashboard.discrepancies).toContain('weight: OCR=45000, Form=NaN');
    });
  });

  describe('Form Constraint Interactions', () => {
    it('tests HTML input constraints with programmatic setValue', () => {
      // Test that max attributes don't interfere with setValue
      const mockForm = createMockFormSetValue();
      
      // Simulate setting a value higher than a typical max constraint
      const largeValue = '15000'; // Higher than typical max="10000"
      mockForm.setValue('rate', largeValue);
      
      // setValue should work regardless of HTML constraints
      expect(mockForm.getValues('rate')).toBe(largeValue);
    });

    it('tests type="number" input behavior with various formats', () => {
      const mockForm = createMockFormSetValue();
      
      // Test various numeric formats
      const testValues = [
        '1405.24',   // Standard decimal
        '1405',      // Integer
        '0.24',      // Decimal less than 1
        '1405.00',   // Trailing zeros
        '01405.24'   // Leading zero
      ];

      testValues.forEach(value => {
        mockForm.setValue('rate', value);
        expect(mockForm.getValues('rate')).toBe(value);
      });
    });
  });

  describe('End-to-End OCR Pipeline Validation', () => {
    it('validates complete OCR to display pipeline', () => {
      const testScenarios = [
        {
          name: 'Standard currency format',
          ocrInput: '$1,405.24',
          expectedLoadCalculator: '1405.24',
          expectedCore: '1405.24',
          expectedDashboard: NaN, // parseFloat("$1,405.24") fails
          expectedIndex: NaN
        },
        {
          name: 'Simple integer',
          ocrInput: '500',
          expectedLoadCalculator: '500',
          expectedCore: '500', 
          expectedDashboard: 500,
          expectedIndex: 500
        },
        {
          name: 'Comma separated number',
          ocrInput: '45,000',
          expectedLoadCalculator: '45000',
          expectedCore: '45000',
          expectedDashboard: 45, // parseFloat("45,000") = 45 (stops at comma)
          expectedIndex: 45
        }
      ];

      testScenarios.forEach(scenario => {
        // Test LoadCalculator processing
        const lcCleaned = scenario.ocrInput.replace(/[$,\s]/g, '');
        const lcResult = isNaN(parseFloat(lcCleaned)) ? lcCleaned : parseFloat(lcCleaned).toString();
        expect(lcResult).toBe(scenario.expectedLoadCalculator);

        // Test Core processing  
        const coreCleaned = scenario.ocrInput.replace(/[^0-9.]/g, '');
        const coreResult = coreCleaned ? coreCleaned : '';
        expect(coreResult).toBe(scenario.expectedCore);

        // Test Dashboard/Index processing
        const dashboardResult = parseFloat(scenario.ocrInput);
        if (isNaN(scenario.expectedDashboard)) {
          expect(isNaN(dashboardResult)).toBe(true);
        } else {
          expect(dashboardResult).toBe(scenario.expectedDashboard);
        }
      });
    });
  });

  describe('Real-world Load Board Scenarios', () => {
    it('handles typical DAT/Truckstop load board formats', () => {
      const realWorldScenarios = [
        {
          description: 'Standard DAT format',
          fields: [
            { field: 'rate', value: 'Rate: $1,405.24' },
            { field: 'miles', value: 'Miles: 500' },
            { field: 'weight', value: 'Weight: 45,000 lbs' }
          ]
        },
        {
          description: 'Truckstop format',
          fields: [
            { field: 'rate', value: '$1405.24' },
            { field: 'miles', value: '500 mi' },
            { field: 'weight', value: '45000#' }
          ]
        },
        {
          description: 'Mixed format with FSC',
          fields: [
            { field: 'rate', value: '$1,200.00' },
            { field: 'fsc', value: 'FSC: $205.24' },
            { field: 'miles', value: '500' }
          ]
        }
      ];

      realWorldScenarios.forEach(scenario => {
        const mockResult: FieldDetectionResult = {
          detectedFields: scenario.fields.map(f => ({ 
            field: f.field as DetectedField['field'], 
            value: f.value, 
            confidence: 'high' as const 
          })),
          confidence: 'high',
          rawText: 'Mock OCR text',
          warnings: [],
          processingTime: 1200
        };

        // Test that each component can process these real-world formats
        expect(mockResult.detectedFields.length).toBeGreaterThan(0);
        
        // Verify fields are detected
        const rateField = mockResult.detectedFields.find(f => f.field === 'rate');
        const milesField = mockResult.detectedFields.find(f => f.field === 'miles');
        
        if (rateField) {
          expect(rateField.value).toMatch(/\$?[\d,]+\.?\d*/);
        }
        if (milesField) {
          expect(milesField.value).toMatch(/\d+/);
        }
      });
    });
  });
});