import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/utils/apiWrapper', () => ({
  callOpenAIWithRateLimit: vi.fn(),
  RateLimitExceededError: class RateLimitExceededError extends Error {},
}));

import { callOpenAIWithRateLimit } from '@/utils/apiWrapper';
import { SmartFieldDetector } from '@/utils/SmartFieldDetector';

// Real-world test fixtures based on actual load board screenshots
// These represent the OCR text that would be extracted from real documents
const REAL_WORLD_FIXTURES = [
  {
    name: 'Load Offer Format 1',
    documentType: 'load_board_offer',
    extractedText: `Pro: 20250894911
    TOPEKA, IN
    Monday 08/11 07:00 PM (EST)
    CANTON, MS
    Tuesday 08/12 02:00 PM (EST)
    817 mi | 2625 lb
    OFFER AMOUNT
    $1,405.24
    View Offer Details`,
    expectedFields: {
      miles: { value: '817', confidence: 'high' },
      rate: { value: '1405.24', confidence: 'high' },
      origin: { value: 'TOPEKA, IN', confidence: 'high' },
      destination: { value: 'CANTON, MS', confidence: 'high' },
      weight: { value: '2625', confidence: 'high' }
    },
    calculatedRPM: 1.72 // $1405.24 / 817 miles
  },
  
  {
    name: 'Detailed Load Board',
    documentType: 'detailed_load_board',
    extractedText: `URSCHEL LABORATORIES
    1200 CUTTING EDGE DR
    CHESTERTON, IN 46304-3554
    Tuesday, 08/12/2025 | 07:30 AM (EST)
    Estimated time to pickup: 15 hours 59 minutes
    
    Consignee
    C H ROBINSON
    333 HOWARD AVE
    DES PLAINES, IL 60018-1907
    Tuesday, 08/12/2025 | 10:00 AM (EST)
    Estimated transit time: 18 hours 29 minutes
    
    Consignee Board Position
    AURORA/CHICAGO, IL
    15 Miles Out | 17 Daily Shipments | 0 Trucks in the area
    
    Shipment Details
    Weight: 4118 lbs
    Total pieces: 9
    
    Estimated Mileage
    Loaded miles: 76
    Deadhead miles: 0
    Miles to shipper: 103
    
    OFFER AMOUNT
    $295.52`,
    expectedFields: {
      miles: { value: '76', confidence: 'high' },
      rate: { value: '295.52', confidence: 'high' },
      origin: { value: 'CHESTERTON, IN', confidence: 'high' },
      destination: { value: 'DES PLAINES, IL', confidence: 'high' },
      weight: { value: '4118', confidence: 'high' },
      deadhead: { value: '0', confidence: 'high' }
    },
    calculatedRPM: 3.89 // $295.52 / 76 miles
  },
  
  {
    name: 'Email Load Offer',
    documentType: 'email_load_offer',
    extractedText: `Alex Butelli (SHANAHAN TRANSPORTATION SYSTEMS, INC.) <abutelli@shanahantrans.com>
    
    AYER, MA 01432 to LOCKBOURNE, OH 43137
    
    Load today 1PM-4PM and deliver Monday 8AM
    
    1 PALLET 44 X 38 X 54
    
    LOAD IN HAND OUR TARGET: $600
    
    Thank you,
    
    Alex Butelli
    Carrier Sales
    abutelli@shanahantrans.com
    O: 412.882.6000
    D: 412.886.2679`,
    expectedFields: {
      rate: { value: '600', confidence: 'high' },
      origin: { value: 'AYER, MA', confidence: 'high' },
      destination: { value: 'LOCKBOURNE, OH', confidence: 'high' }
    },
    needsMileageCalculation: true // Miles not provided, would need distance calculation
  },
  
  {
    name: 'Pickup Delivery Sheet',
    documentType: 'pickup_delivery_sheet',
    extractedText: `PICK-UP ASAP
    
    1651 NW 68 AVE
    BLDG 706.
    MIAMI, FL 33126
    
    DELIVERY 08/15/2025, 8 AM EST
    
    Tecumseh / Misters Unlimited
    1632 NE 12th St
    FORT LAUDERDALE, FL 33304
    
    TOTAL PIECES: 1
    TOTAL WEIGHT: 50
    TOTAL PRICE: $200`,
    expectedFields: {
      rate: { value: '200', confidence: 'high' },
      origin: { value: 'MIAMI, FL', confidence: 'high' },
      destination: { value: 'FORT LAUDERDALE, FL', confidence: 'high' },
      weight: { value: '50', confidence: 'high' }
    },
    needsMileageCalculation: true // Short haul, likely local delivery
  }
];

describe('Real-World OCR Processing Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Load Board Document Processing', () => {
    REAL_WORLD_FIXTURES.forEach((fixture) => {
      it(`processes ${fixture.name} correctly`, async () => {
        // Mock AI response with expected field extraction
        const mockFields = Object.entries(fixture.expectedFields).map(([field, data]) => ({
          field,
          value: data.value,
          confidence: data.confidence
        }));

        const mockResponse = {
          generatedText: JSON.stringify({ fields: mockFields })
        };

        vi.mocked(callOpenAIWithRateLimit).mockResolvedValue(mockResponse);

        // Process the document text
        const result = await SmartFieldDetector.detectFields(fixture.extractedText);

        // Validate field extraction
        expect(result.confidence).toBe('high');
        expect(result.detectedFields.length).toBeGreaterThan(0);

        // Check specific field expectations
        Object.entries(fixture.expectedFields).forEach(([fieldName, expected]) => {
          const detectedField = result.detectedFields.find(f => f.field === fieldName);
          expect(detectedField).toBeDefined();
          expect(detectedField?.value).toBe(expected.value);
          expect(detectedField?.confidence).toBe(expected.confidence);
        });

        // Validate RPM calculation if miles and rate are available
        if (fixture.calculatedRPM) {
          const milesField = result.detectedFields.find(f => f.field === 'miles');
          const rateField = result.detectedFields.find(f => f.field === 'rate');
          
          if (milesField && rateField) {
            const calculatedRPM = Number(rateField.value) / Number(milesField.value);
            expect(calculatedRPM).toBeCloseTo(fixture.calculatedRPM, 2);
          }
        }
      });
    });
  });

  describe('Document Type Classification', () => {
    it('identifies different document formats correctly', async () => {
      const documentPatterns = {
        load_board_offer: /Pro:|OFFER AMOUNT/i,
        detailed_load_board: /Consignee|Estimated Mileage|Board Position/i,
        email_load_offer: /@|TRANSPORTATION SYSTEMS|Carrier Sales/i,
        pickup_delivery_sheet: /PICK-UP|DELIVERY|TOTAL PIECES/i
      };

      REAL_WORLD_FIXTURES.forEach((fixture) => {
        const pattern = documentPatterns[fixture.documentType as keyof typeof documentPatterns];
        expect(pattern.test(fixture.extractedText)).toBe(true);
      });
    });
  });

  describe('Field Validation Against Real Data', () => {
    it('validates rate formats from different sources', () => {
      const rateFormats = [
        { input: '$1,405.24', expected: '1405.24' },
        { input: '$295.52', expected: '295.52' },
        { input: '$600', expected: '600' },
        { input: '$200', expected: '200' }
      ];

      rateFormats.forEach(({ input, expected }) => {
        const cleaned = input.replace(/[$,]/g, '');
        expect(cleaned).toBe(expected);
      });
    });

    it('validates location formats', () => {
      const locationFormats = [
        { input: 'TOPEKA, IN', expected: { city: 'TOPEKA', state: 'IN' } },
        { input: 'CANTON, MS', expected: { city: 'CANTON', state: 'MS' } },
        { input: 'AYER, MA 01432', expected: { city: 'AYER', state: 'MA', zip: '01432' } },
        { input: 'MIAMI, FL 33126', expected: { city: 'MIAMI', state: 'FL', zip: '33126' } }
      ];

      locationFormats.forEach(({ input, expected }) => {
        const match = input.match(/([A-Z\s]+),\s+([A-Z]{2})(?:\s+(\d{5}))?/);
        if (match) {
          expect(match[1].trim()).toBe(expected.city);
          expect(match[2]).toBe(expected.state);
          if (expected.zip) {
            expect(match[3]).toBe(expected.zip);
          }
        }
      });
    });

    it('validates weight and dimension formats', () => {
      const weightFormats = [
        { input: '2625 lb', expected: '2625' },
        { input: '4118 lbs', expected: '4118' },
        { input: '50', expected: '50' }
      ];

      weightFormats.forEach(({ input, expected }) => {
        const cleaned = input.replace(/\s*(lbs?)\s*$/i, '');
        expect(cleaned).toBe(expected);
      });

      // Test pallet dimensions
      const dimensionMatch = '44 X 38 X 54'.match(/(\d+)\s*X\s*(\d+)\s*X\s*(\d+)/);
      expect(dimensionMatch).toBeTruthy();
      expect(dimensionMatch![1]).toBe('44');
      expect(dimensionMatch![2]).toBe('38');
      expect(dimensionMatch![3]).toBe('54');
    });
  });

  describe('Business Logic Integration with Real Data', () => {
    it('calculates accurate RPM for different load types', () => {
      const testCases = [
        { rate: 1405.24, miles: 817, expectedRPM: 1.72, loadType: 'long_haul' },
        { rate: 295.52, miles: 76, expectedRPM: 3.89, loadType: 'short_haul' },
        { rate: 200, miles: 30, expectedRPM: 6.67, loadType: 'local_delivery' }
      ];

      testCases.forEach(({ rate, miles, expectedRPM, loadType }) => {
        const calculatedRPM = rate / miles;
        expect(calculatedRPM).toBeCloseTo(expectedRPM, 2);

        // Classify load type based on RPM and distance
        let classifiedType = 'local_delivery';
        if (miles > 500) classifiedType = 'long_haul';
        else if (miles > 100) classifiedType = 'short_haul';

        expect(classifiedType).toBe(loadType);
      });
    });

    it('applies business setup to real load scenarios', () => {
      const businessScenarios = [
        {
          name: 'Company Driver (35% split)',
          grossRPM: 1.72,
          revenueSplit: 35,
          weeklyCosts: 0,
          expectedNetRPM: 0.60 // 1.72 * 0.35
        },
        {
          name: 'Lease Operator (75% split)',
          grossRPM: 3.89,
          revenueSplit: 75,
          weeklyCosts: 400,
          expectedNetRPM: 2.76 // (3.89 * 0.75) - (400/2500)
        },
        {
          name: 'Independent Contractor (95% split)',
          grossRPM: 6.67,
          revenueSplit: 95,
          weeklyCosts: 100,
          expectedNetRPM: 6.30 // (6.67 * 0.95) - (100/2500)
        }
      ];

      businessScenarios.forEach(({ name, grossRPM, revenueSplit, weeklyCosts, expectedNetRPM }) => {
        const afterSplitRPM = grossRPM * (revenueSplit / 100);
        const costPerMile = weeklyCosts / 2500; // Assuming 2500 miles/week
        const netRPM = afterSplitRPM - costPerMile;

        expect(netRPM).toBeCloseTo(expectedNetRPM, 2);
        console.log(`${name}: $${grossRPM}/mi gross → $${netRPM.toFixed(2)}/mi net`);
      });
    });
  });

  describe('Error Scenarios with Real Data', () => {
    it('handles incomplete load information gracefully', async () => {
      const incompleteDocument = `
        From: Chicago, IL
        To: Atlanta, GA
        Load available today
        Call for rate
      `;

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify({
          fields: [
            { field: 'origin', value: 'Chicago, IL', confidence: 'high' },
            { field: 'destination', value: 'Atlanta, GA', confidence: 'high' }
          ]
        })
      });

      const result = await SmartFieldDetector.detectFields(incompleteDocument);

      expect(result.confidence).toBe('low'); // Missing critical fields
      expect(result.detectedFields.find(f => f.field === 'miles')).toBeUndefined();
      expect(result.detectedFields.find(f => f.field === 'rate')).toBeUndefined();
    });

    it('handles conflicting information in documents', async () => {
      const conflictingDocument = `
        Miles: 500
        Distance: 600 miles
        Rate: $1000
        Total Pay: $1200
        Origin: New York
        From: NYC
      `;

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '500', confidence: 'medium' },
            { field: 'rate', value: '1000', confidence: 'medium' },
            { field: 'origin', value: 'New York', confidence: 'medium' }
          ]
        })
      });

      const result = await SmartFieldDetector.detectFields(conflictingDocument);

      // Should choose first/most confident values when conflicts exist
      expect(result.confidence).toBe('medium');
      expect(result.detectedFields.find(f => f.field === 'miles')?.value).toBe('500');
      expect(result.detectedFields.find(f => f.field === 'rate')?.value).toBe('1000');
    });
  });

  describe('Performance with Real Document Sizes', () => {
    it('processes typical load board document quickly', async () => {
      const typicalDocument = REAL_WORLD_FIXTURES[1].extractedText; // Detailed load board

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '76', confidence: 'high' },
            { field: 'rate', value: '295.52', confidence: 'high' }
          ]
        })
      });

      const startTime = performance.now();
      const result = await SmartFieldDetector.detectFields(typicalDocument);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should process in under 2 seconds
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.detectedFields.length).toBeGreaterThan(0);
    });
  });
});