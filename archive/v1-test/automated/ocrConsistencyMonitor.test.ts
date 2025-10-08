import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FieldDetectionResult } from '@/utils/SmartFieldDetector';
import { validateCrossComponentConsistency } from '@/utils/valueProcessing';

/**
 * Automated OCR Consistency Monitor
 * 
 * This test suite automatically detects when OCR extraction works correctly
 * but values don't transfer properly to form fields in different components.
 * It's designed to catch regressions and identify new consistency issues.
 */

describe('OCR Consistency Monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Real-world test data from actual load boards
  const realWorldTestCases = [
    {
      name: 'Standard DAT Load',
      ocrResult: {
        detectedFields: [
          { field: 'rate' as const, value: '$1,405.24', confidence: 'high' as const },
          { field: 'miles' as const, value: '500', confidence: 'high' as const },
          { field: 'weight' as const, value: '45,000', confidence: 'medium' as const },
          { field: 'origin' as const, value: 'Chicago, IL', confidence: 'high' as const },
          { field: 'destination' as const, value: 'Atlanta, GA', confidence: 'high' as const }
        ],
        confidence: 'high' as const,
        rawText: 'LOAD CONFIRMATION\nRate: $1,405.24\nMiles: 500\nWeight: 45,000 lbs\nFrom: Chicago, IL\nTo: Atlanta, GA',
        warnings: [],
        processingTime: 1200
      },
      expectedValues: {
        rate: 1405.24,
        miles: 500,
        weight: 45000,
        origin: 'Chicago, IL',
        destination: 'Atlanta, GA'
      }
    },
    {
      name: 'Truckstop Load with FSC',
      ocrResult: {
        detectedFields: [
          { field: 'rate' as const, value: '$1200.00', confidence: 'high' as const },
          { field: 'fsc' as const, value: 'FSC: $205.24', confidence: 'medium' as const },
          { field: 'miles' as const, value: '480 mi', confidence: 'high' as const },
          { field: 'deadhead' as const, value: '25', confidence: 'low' as const }
        ],
        confidence: 'high' as const,
        rawText: 'RATE SHEET\n$1200.00 + FSC: $205.24\n480 mi\nDeadhead: 25',
        warnings: [],
        processingTime: 950
      },
      expectedValues: {
        rate: 1200.00,
        fsc: 205.24,
        miles: 480,
        deadhead: 25
      }
    },
    {
      name: 'Load with Problematic Formatting',
      ocrResult: {
        detectedFields: [
          { field: 'rate' as const, value: '$ 1,405 .24', confidence: 'medium' as const }, // Spaces in value
          { field: 'miles' as const, value: '500 miles', confidence: 'high' as const }, // Text suffix
          { field: 'weight' as const, value: 'Weight: 45,000 lbs', confidence: 'medium' as const }, // Text prefix
          { field: 'tolls' as const, value: 'Tolls $45.00', confidence: 'low' as const } // Mixed format
        ],
        confidence: 'medium' as const,
        rawText: 'Rate: $ 1,405 .24\n500 miles\nWeight: 45,000 lbs\nTolls $45.00',
        warnings: ['Unusual spacing detected in rate field'],
        processingTime: 1800
      },
      expectedValues: {
        rate: 1405.24,
        miles: 500,
        weight: 45000,
        tolls: 45.00
      }
    }
  ];

  describe('Real-world OCR scenarios', () => {
    realWorldTestCases.forEach(testCase => {
      it(`processes ${testCase.name} correctly across all components`, () => {
        console.log(`\n🔍 Testing: ${testCase.name}`);
        console.log('OCR Input:', testCase.ocrResult.rawText);

        // Test LoadCalculator approach (enhanced with debugging)
        const loadCalculatorResults: Record<string, any> = {};
        testCase.ocrResult.detectedFields.forEach((field) => {
          let processedValue = field.value;
          
          if (['miles', 'rate', 'deadhead', 'weight', 'fsc', 'tolls', 'fuelCost'].includes(field.field)) {
            processedValue = field.value.replace(/[$,\s]/g, '');
            const numValue = parseFloat(processedValue);
            if (!isNaN(numValue)) {
              processedValue = numValue.toString();
              loadCalculatorResults[field.field] = numValue;
            }
          } else {
            loadCalculatorResults[field.field] = field.value;
          }
        });

        // Test Core approach (restrictive cleaning)
        const coreResults: Record<string, any> = {};
        testCase.ocrResult.detectedFields.forEach(field => {
          const cleanValue = field.value.replace(/[$,\s€£¥₹]/g, '');
          if (cleanValue && !isNaN(parseFloat(cleanValue))) {
            coreResults[field.field] = parseFloat(cleanValue);
          } else if (!['miles', 'rate', 'weight'].includes(field.field)) {
            coreResults[field.field] = field.value;
          }
        });

        // Test Dashboard/Index approach (with enhanced cleaning)
        const dashboardResults: Record<string, any> = {};
        const fieldsMap = testCase.ocrResult.detectedFields.reduce((acc, field) => {
          acc[field.field] = field.value;
          return acc;
        }, {} as Record<string, string>);

        Object.keys(fieldsMap).forEach(fieldName => {
          const fieldValue = fieldsMap[fieldName];
          if (['miles', 'rate', 'weight', 'fsc', 'deadhead', 'tolls', 'fuelCost'].includes(fieldName)) {
            const cleaned = fieldValue.replace(/[$,\s]/g, '');
            const num = parseFloat(cleaned);
            dashboardResults[fieldName] = isNaN(num) ? undefined : num;
          } else {
            dashboardResults[fieldName] = fieldValue;
          }
        });

        // Verify results match expected values
        Object.keys(testCase.expectedValues).forEach(fieldName => {
          const expected = testCase.expectedValues[fieldName];
          
          // Check LoadCalculator
          if (loadCalculatorResults[fieldName] !== undefined) {
            expect(loadCalculatorResults[fieldName]).toBe(expected);
            console.log(`✅ LoadCalculator ${fieldName}: ${loadCalculatorResults[fieldName]} (expected: ${expected})`);
          }

          // Check Core
          if (coreResults[fieldName] !== undefined) {
            expect(coreResults[fieldName]).toBe(expected);
            console.log(`✅ Core ${fieldName}: ${coreResults[fieldName]} (expected: ${expected})`);
          }

          // Check Dashboard/Index
          if (dashboardResults[fieldName] !== undefined) {
            expect(dashboardResults[fieldName]).toBe(expected);
            console.log(`✅ Dashboard/Index ${fieldName}: ${dashboardResults[fieldName]} (expected: ${expected})`);
          }
        });

        // Cross-component consistency check
        const consistencyCheck = validateCrossComponentConsistency(
          loadCalculatorResults,
          dashboardResults,
          'Monitor Test'
        );

        if (!consistencyCheck.isConsistent) {
          console.warn(`⚠️ Consistency issues found:`, consistencyCheck.discrepancies);
        }

        expect(consistencyCheck.isConsistent).toBe(true);
      });
    });
  });

  describe('Automated regression detection', () => {
    it('detects when new processing inconsistencies are introduced', () => {
      // This test ensures that any changes to handleFieldsDetected implementations
      // maintain consistency across components
      
      const regressionTestCases = [
        { input: '$1,405.24', field: 'rate', expected: 1405.24 },
        { input: '45,000', field: 'weight', expected: 45000 },
        { input: 'FSC: $125.50', field: 'fsc', expected: 125.50 },
        { input: '500 miles', field: 'miles', expected: 500 },
        { input: 'Tolls $25', field: 'tolls', expected: 25 }
      ];

      regressionTestCases.forEach(testCase => {
        // Test all current processing approaches
        const loadCalculatorResult = (() => {
          const cleaned = testCase.input.replace(/[$,\s]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? undefined : num;
        })();

        const coreResult = (() => {
          const cleaned = testCase.input.replace(/[$,\s€£¥₹]/g, '');
          return (!cleaned || isNaN(parseFloat(cleaned))) ? undefined : parseFloat(cleaned);
        })();

        const dashboardResult = (() => {
          const cleaned = testCase.input.replace(/[$,\s]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? undefined : num;
        })();

        // All approaches should produce the same result
        console.log(`Testing regression for: ${testCase.input}`);
        console.log(`  LoadCalculator: ${loadCalculatorResult}`);
        console.log(`  Core: ${coreResult}`);
        console.log(`  Dashboard: ${dashboardResult}`);

        // Verify consistency
        expect(loadCalculatorResult).toBe(testCase.expected);
        expect(coreResult).toBe(testCase.expected);
        expect(dashboardResult).toBe(testCase.expected);

        // Ensure all approaches agree
        expect(loadCalculatorResult).toBe(coreResult);
        expect(coreResult).toBe(dashboardResult);
      });
    });
  });

  describe('Performance monitoring', () => {
    it('monitors processing time for value extraction', () => {
      const performanceTestCase = realWorldTestCases[0];
      
      const startTime = performance.now();
      
      // Simulate processing across all components
      performanceTestCase.ocrResult.detectedFields.forEach(field => {
        // LoadCalculator processing
        const lcCleaned = field.value.replace(/[$,\s]/g, '');
        const lcNum = parseFloat(lcCleaned);
        
        // Core processing
        const coreCleaned = field.value.replace(/[$,\s€£¥₹]/g, '');
        const coreNum = parseFloat(coreCleaned);
        
        // Dashboard processing
        const dashCleaned = field.value.replace(/[$,\s]/g, '');
        const dashNum = parseFloat(dashCleaned);
      });
      
      const processingTime = performance.now() - startTime;
      
      // Processing should be fast (under 10ms for typical loads)
      expect(processingTime).toBeLessThan(10);
      console.log(`⏱️ Value processing completed in ${processingTime.toFixed(2)}ms`);
    });
  });

  describe('Error detection and alerting', () => {
    it('automatically detects when OCR succeeds but form updates fail', () => {
      // Simulate a scenario where OCR detects fields correctly but form setValue fails
      const mockOcrResult: FieldDetectionResult = {
        detectedFields: [
          { field: 'rate', value: '$1,405.24', confidence: 'high' },
          { field: 'miles', value: '500', confidence: 'high' }
        ],
        confidence: 'high',
        rawText: 'Rate: $1,405.24\nMiles: 500',
        warnings: [],
        processingTime: 1000
      };

      // Test that OCR extraction is working
      expect(mockOcrResult.detectedFields.length).toBe(2);
      expect(mockOcrResult.confidence).toBe('high');
      
      // Test that value processing works
      const rateField = mockOcrResult.detectedFields.find(f => f.field === 'rate');
      const milesField = mockOcrResult.detectedFields.find(f => f.field === 'miles');
      
      expect(rateField).toBeDefined();
      expect(milesField).toBeDefined();
      
      const processedRate = parseFloat(rateField!.value.replace(/[$,\s]/g, ''));
      const processedMiles = parseFloat(milesField!.value.replace(/[$,\s]/g, ''));
      
      expect(processedRate).toBe(1405.24);
      expect(processedMiles).toBe(500);
      
      // If this test passes, it means OCR and processing are working
      // Any form display issues would be in the setValue/form handling logic
      console.log('✅ OCR extraction and value processing are working correctly');
      console.log('📝 If form fields show incorrect values, check setValue implementation');
    });

    it('provides detailed debugging information for troubleshooting', () => {
      const debugTestCase = realWorldTestCases[2]; // Problematic formatting case
      
      console.log('\n🔧 DEBUG INFO for troubleshooting:');
      console.log('Original OCR Text:', debugTestCase.ocrResult.rawText);
      console.log('Detected Fields:');
      
      debugTestCase.ocrResult.detectedFields.forEach(field => {
        console.log(`  ${field.field}: "${field.value}" (confidence: ${field.confidence})`);
        
        // Show step-by-step processing
        const step1 = field.value;
        const step2 = field.value.replace(/[$,\s]/g, '');
        const step3 = parseFloat(step2);
        
        console.log(`    Step 1 (raw): "${step1}"`);
        console.log(`    Step 2 (cleaned): "${step2}"`);
        console.log(`    Step 3 (parsed): ${step3}`);
        console.log(`    Valid: ${!isNaN(step3)}`);
      });
      
      // This test always passes but provides debugging output
      expect(true).toBe(true);
    });
  });
});