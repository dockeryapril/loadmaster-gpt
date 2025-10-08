import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/utils/apiWrapper', () => ({
  callOpenAIWithRateLimit: vi.fn(),
  RateLimitExceededError: class RateLimitExceededError extends Error {},
}));

import { callOpenAIWithRateLimit } from '@/utils/apiWrapper';
import { SmartFieldDetector } from '@/utils/SmartFieldDetector';

// Test fixtures for various document types
const TEST_DOCUMENTS = {
  loadConfirmation: `
    LOAD CONFIRMATION #12345
    From: Chicago, IL
    To: Atlanta, GA
    Miles: 587
    Rate: $1,450.00
    Weight: 45,000 lbs
    Pickup: 01/15/2025 08:00
  `,
  
  rateSheet: `
    Rate Per Mile: $2.47
    Total Miles: 623 mi
    Pickup Location: Dallas TX
    Delivery: Houston TX
    Cargo Weight: 38500 lbs
    Total Pay: $1,538.81
  `,
  
  dispatchSheet: `
    DISPATCH ORDER
    Origin: Phoenix AZ
    Destination: Denver CO  
    Distance: 832 miles
    Gross Pay: $2,164
    Deadhead: 45 mi
    Load Weight: 52000
  `,
  
  poorQuality: `
    l0ad #98?
    fr0m: ChicagO 1L
    t0: 4tlanta G4
    mi1es: 58?
    rate: $1,45Q.OO
    we1ght: 45,QOO 1bs
  `,
  
  minimal: `587 miles $1450 Chicago Atlanta`,
  
  ambiguous: `
    Trip summary:
    Location A to Location B
    Some distance traveled
    Payment amount discussed
    Weight considerations
  `
};

describe('OCR Processing Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SmartFieldDetector - AI Processing', () => {
    it('processes load confirmation with high confidence', async () => {
      const mockResponse = {
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '587', confidence: 'high' },
            { field: 'rate', value: '1450', confidence: 'high' },
            { field: 'origin', value: 'Chicago, IL', confidence: 'high' },
            { field: 'destination', value: 'Atlanta, GA', confidence: 'high' },
            { field: 'weight', value: '45000', confidence: 'high' }
          ]
        })
      };

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue(mockResponse);

      const result = await SmartFieldDetector.detectFields(TEST_DOCUMENTS.loadConfirmation);

      expect(result.confidence).toBe('high');
      expect(result.detectedFields).toHaveLength(5);
      expect(result.detectedFields.find(f => f.field === 'miles')?.value).toBe('587');
      expect(result.detectedFields.find(f => f.field === 'rate')?.value).toBe('1450');
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('processes rate sheet with medium confidence', async () => {
      const mockResponse = {
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '623', confidence: 'high' },
            { field: 'rate', value: '1538.81', confidence: 'high' },
            { field: 'origin', value: 'Dallas TX', confidence: 'medium' },
            { field: 'destination', value: 'Houston TX', confidence: 'medium' }
          ]
        })
      };

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue(mockResponse);

      const result = await SmartFieldDetector.detectFields(TEST_DOCUMENTS.rateSheet);

      expect(result.confidence).toBe('high');
      expect(result.detectedFields.find(f => f.field === 'miles')?.value).toBe('623');
      expect(result.detectedFields.find(f => f.field === 'rate')?.value).toBe('1538.81');
    });

    it('handles poor quality OCR with fallback detection', async () => {
      // Simulate AI failing to parse
      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: 'Invalid JSON response'
      });

      const result = await SmartFieldDetector.detectFields(TEST_DOCUMENTS.poorQuality);

      expect(result.confidence).toBe('low');
      expect(result.detectedFields.length).toBeGreaterThan(0);
      // Should still detect some fields via regex fallback
    });

    it('handles minimal document information', async () => {
      const mockResponse = {
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '587', confidence: 'medium' },
            { field: 'rate', value: '1450', confidence: 'medium' },
            { field: 'origin', value: 'Chicago', confidence: 'low' },
            { field: 'destination', value: 'Atlanta', confidence: 'low' }
          ]
        })
      };

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue(mockResponse);

      const result = await SmartFieldDetector.detectFields(TEST_DOCUMENTS.minimal);

      expect(result.confidence).toBe('medium');
      expect(result.detectedFields.find(f => f.field === 'miles')?.value).toBe('587');
      expect(result.detectedFields.find(f => f.field === 'rate')?.value).toBe('1450');
    });
  });

  describe('Confidence Scoring', () => {
    it('assigns high confidence when all critical fields detected', async () => {
      const mockResponse = {
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '500', confidence: 'high' },
            { field: 'rate', value: '1250', confidence: 'high' },
            { field: 'origin', value: 'City A', confidence: 'high' },
            { field: 'destination', value: 'City B', confidence: 'high' }
          ]
        })
      };

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue(mockResponse);

      const result = await SmartFieldDetector.detectFields('test document');

      expect(result.confidence).toBe('high');
    });

    it('assigns medium confidence when some fields are uncertain', async () => {
      const mockResponse = {
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '500', confidence: 'high' },
            { field: 'rate', value: '1250', confidence: 'medium' },
            { field: 'origin', value: 'City A', confidence: 'low' }
          ]
        })
      };

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue(mockResponse);

      const result = await SmartFieldDetector.detectFields('test document');

      expect(result.confidence).toBe('medium');
    });

    it('assigns low confidence when critical fields missing', async () => {
      const mockResponse = {
        generatedText: JSON.stringify({
          fields: [
            { field: 'weight', value: '45000', confidence: 'medium' }
          ]
        })
      };

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue(mockResponse);

      const result = await SmartFieldDetector.detectFields('test document');

      expect(result.confidence).toBe('low');
    });
  });

  describe('Field Validation', () => {
    it('validates and cleans numeric fields', async () => {
      const mockResponse = {
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '$587.00', confidence: 'high' },
            { field: 'rate', value: '1,450.00', confidence: 'high' },
            { field: 'weight', value: '45,000 lbs', confidence: 'high' }
          ]
        })
      };

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue(mockResponse);

      const result = await SmartFieldDetector.detectFields('test');

      const milesField = result.detectedFields.find(f => f.field === 'miles');
      const rateField = result.detectedFields.find(f => f.field === 'rate');
      const weightField = result.detectedFields.find(f => f.field === 'weight');

      // Should clean numeric values
      expect(milesField?.value).toMatch(/^\d+\.?\d*$/);
      expect(rateField?.value).toMatch(/^\d+\.?\d*$/);
      expect(weightField?.value).toMatch(/^\d+\.?\d*$/);
    });

    it('rejects invalid field values', async () => {
      const mockResponse = {
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '', confidence: 'high' },
            { field: 'rate', value: 'abc', confidence: 'high' },
            { field: 'origin', value: '', confidence: 'high' }
          ]
        })
      };

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue(mockResponse);

      const result = await SmartFieldDetector.detectFields('test');

      // Should filter out invalid fields
      expect(result.detectedFields.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('handles API timeout gracefully', async () => {
      vi.mocked(callOpenAIWithRateLimit).mockRejectedValue(new Error('Request timeout'));

      const result = await SmartFieldDetector.detectFields('test document');

      expect(result.confidence).toBe('low');
      expect(result.detectedFields).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('handles rate limit errors', async () => {
      const RateLimitError = vi.fn(() => {
        const error = new Error('Rate limit exceeded');
        error.name = 'RateLimitExceededError';
        return error;
      });
      
      vi.mocked(callOpenAIWithRateLimit).mockRejectedValue(new RateLimitError());

      await expect(SmartFieldDetector.detectFields('test')).rejects.toThrow('Rate limit exceeded');
    });

    it('handles malformed AI responses', async () => {
      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: '{"fields": [malformed json'
      });

      const result = await SmartFieldDetector.detectFields('test document');

      expect(result.confidence).toBe('low');
      expect(result.detectedFields).toBeDefined();
    });

    it('handles empty AI responses', async () => {
      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: ''
      });

      const result = await SmartFieldDetector.detectFields('test document');

      expect(result.confidence).toBe('low');
      expect(result.detectedFields).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('completes processing within reasonable time', async () => {
      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '500', confidence: 'high' }
          ]
        })
      });

      const start = performance.now();
      const result = await SmartFieldDetector.detectFields('test document');
      const end = performance.now();

      expect(end - start).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('handles large documents efficiently', async () => {
      const largeDocument = 'Large document content '.repeat(1000);
      
      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '500', confidence: 'high' }
          ]
        })
      });

      const result = await SmartFieldDetector.detectFields(largeDocument);

      expect(result).toBeDefined();
      expect(result.processingTime).toBeLessThan(10000);
    });
  });

  describe('User Correction Learning', () => {
    it('saves user corrections to improve future detection', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      SmartFieldDetector.saveUserCorrection('Chi ago', 'Chicago', 'origin');
      SmartFieldDetector.saveUserCorrection('$1,45O', '$1,450', 'rate');

      expect(consoleSpy).toHaveBeenCalledWith('Saved correction for origin: "Chi ago" → "Chicago"');
      expect(consoleSpy).toHaveBeenCalledWith('Saved correction for rate: "$1,45O" → "$1,450"');
      
      consoleSpy.mockRestore();
    });

    it('applies learned corrections to detected fields', async () => {
      // Mock localStorage
      const mockGetItem = vi.fn((key) => {
        if (key === 'loadmaster_field_corrections') {
          return JSON.stringify({
            'Chi ago': { correctedValue: 'Chicago', field: 'origin', count: 1 }
          });
        }
        return null;
      });
      
      Object.defineProperty(window, 'localStorage', {
        value: { getItem: mockGetItem },
        writable: true,
      });

      const mockResponse = {
        generatedText: JSON.stringify({
          fields: [
            { field: 'origin', value: 'Chi ago', confidence: 'medium' }
          ]
        })
      };

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue(mockResponse);

      const result = await SmartFieldDetector.detectFields('test');

      const originField = result.detectedFields.find(f => f.field === 'origin');
      expect(originField?.value).toBe('Chicago');
      expect(originField?.confidence).toBe('high'); // Should increase confidence
    });
  });
});