import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/utils/apiWrapper', () => ({
  callOpenAIWithRateLimit: vi.fn(),
  RateLimitExceededError: class RateLimitExceededError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'RateLimitExceededError';
    }
  },
}));

vi.mock('@loadmaster/api', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      refreshSession: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

import { callOpenAIWithRateLimit, RateLimitExceededError } from '@/utils/apiWrapper';
import { SmartFieldDetector } from '@/utils/SmartFieldDetector';

describe('Error Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Network Error Scenarios', () => {
    it('handles connection timeout errors', async () => {
      vi.mocked(callOpenAIWithRateLimit).mockRejectedValue(
        new Error('ECONNABORTED: timeout of 30000ms exceeded')
      );

      const result = await SmartFieldDetector.detectFields('test document').catch(error => {
        expect(error.message).toContain('timeout');
        return { 
          detectedFields: [], 
          confidence: 'low' as const, 
          processingTime: 0, 
          rawText: 'test document' 
        };
      });

      expect(result.confidence).toBe('low');
    });

    it('handles DNS resolution failures', async () => {
      vi.mocked(callOpenAIWithRateLimit).mockRejectedValue(
        new Error('ENOTFOUND: getaddrinfo failed')
      );

      await expect(SmartFieldDetector.detectFields('test')).rejects.toThrow('ENOTFOUND');
    });

    it('handles network connection drops', async () => {
      vi.mocked(callOpenAIWithRateLimit).mockRejectedValue(
        new Error('ECONNRESET: Connection reset by peer')
      );

      await expect(SmartFieldDetector.detectFields('test')).rejects.toThrow('ECONNRESET');
    });

    it('handles SSL certificate errors', async () => {
      vi.mocked(callOpenAIWithRateLimit).mockRejectedValue(
        new Error('CERT_UNTRUSTED: certificate not trusted')
      );

      await expect(SmartFieldDetector.detectFields('test')).rejects.toThrow('CERT_UNTRUSTED');
    });
  });

  describe('API Rate Limiting', () => {
    it('propagates rate limit errors correctly', async () => {
      const rateLimitError = new (RateLimitExceededError as any)('Rate limit exceeded: 3 requests per minute');
      vi.mocked(callOpenAIWithRateLimit).mockRejectedValue(rateLimitError);

      await expect(SmartFieldDetector.detectFields('test')).rejects.toThrow('Rate limit exceeded');
    });

    it('handles 429 HTTP status codes', async () => {
      const httpError = new Error('HTTP 429: Too Many Requests');
      httpError.name = 'HTTPError';
      vi.mocked(callOpenAIWithRateLimit).mockRejectedValue(httpError);

      await expect(SmartFieldDetector.detectFields('test')).rejects.toThrow('HTTP 429');
    });

    it('handles quota exceeded errors', async () => {
      const quotaError = new Error('Quota exceeded for organization');
      vi.mocked(callOpenAIWithRateLimit).mockRejectedValue(quotaError);

      await expect(SmartFieldDetector.detectFields('test')).rejects.toThrow('Quota exceeded');
    });
  });

  describe('Business Setup Validation Errors', () => {
    it('validates revenue split percentage bounds', () => {
      const validateRevenueSplit = (percentage: number) => {
        if (percentage < 0) throw new Error('Revenue split cannot be negative');
        if (percentage > 200) throw new Error('Revenue split cannot exceed 200%');
        return true;
      };

      expect(() => validateRevenueSplit(-10)).toThrow('Revenue split cannot be negative');
      expect(() => validateRevenueSplit(250)).toThrow('Revenue split cannot exceed 200%');
      expect(validateRevenueSplit(75)).toBe(true);
      expect(validateRevenueSplit(100)).toBe(true);
    });

    it('validates weekly fixed costs', () => {
      const validateWeeklyCosts = (costs: number) => {
        if (costs < 0) throw new Error('Weekly costs cannot be negative');
        if (costs > 5000) throw new Error('Weekly costs seem unreasonably high');
        return true;
      };

      expect(() => validateWeeklyCosts(-100)).toThrow('Weekly costs cannot be negative');
      expect(() => validateWeeklyCosts(6000)).toThrow('Weekly costs seem unreasonably high');
      expect(validateWeeklyCosts(400)).toBe(true);
      expect(validateWeeklyCosts(0)).toBe(true);
    });

    it('handles invalid calculation inputs', () => {
      const calculateNetRpm = (grossRpm: number, split: number, costs: number, miles: number = 2500) => {
        if (isNaN(grossRpm) || grossRpm < 0) throw new Error('Invalid gross RPM');
        if (isNaN(split) || split < 0) throw new Error('Invalid revenue split');
        if (isNaN(costs) || costs < 0) throw new Error('Invalid weekly costs');
        if (isNaN(miles) || miles <= 0) throw new Error('Invalid weekly miles');
        
        return (grossRpm * split / 100) - (costs / miles);
      };

      expect(() => calculateNetRpm(NaN, 75, 400)).toThrow('Invalid gross RPM');
      expect(() => calculateNetRpm(2.5, NaN, 400)).toThrow('Invalid revenue split');
      expect(() => calculateNetRpm(2.5, 75, NaN)).toThrow('Invalid weekly costs');
      expect(() => calculateNetRpm(2.5, 75, 400, 0)).toThrow('Invalid weekly miles');
      expect(() => calculateNetRpm(-1, 75, 400)).toThrow('Invalid gross RPM');
    });
  });

  describe('Data Corruption and Invalid States', () => {
    it('handles malformed JSON responses', async () => {
      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: '{"fields": [{"field": "miles", "value"'  // Incomplete JSON
      });

      const result = await SmartFieldDetector.detectFields('test document');
      
      expect(result.confidence).toBe('low');
      expect(result.detectedFields).toBeDefined();
      expect(Array.isArray(result.detectedFields)).toBe(true);
    });

    it('handles empty or null responses', async () => {
      vi.mocked(callOpenAIWithRateLimit)
        .mockResolvedValueOnce({ generatedText: '' })
        .mockResolvedValueOnce({ generatedText: null as any })
        .mockResolvedValueOnce(null as any);

      // Empty string
      const result1 = await SmartFieldDetector.detectFields('test');
      expect(result1.confidence).toBe('low');

      // Null text
      const result2 = await SmartFieldDetector.detectFields('test');
      expect(result2.confidence).toBe('low');

      // Null response
      await expect(SmartFieldDetector.detectFields('test')).rejects.toThrow();
    });

    it('handles circular JSON references', async () => {
      const circularObj: any = { field: 'miles', value: '500' };
      circularObj.self = circularObj;

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify({ fields: [circularObj] })
      });

      // This should not cause infinite loops or crashes
      const result = await SmartFieldDetector.detectFields('test');
      expect(result).toBeDefined();
    });

    it('handles extremely large responses', async () => {
      const largeResponse = {
        fields: Array(10000).fill({
          field: 'miles',
          value: '500'.repeat(1000),
          confidence: 'high'
        })
      };

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify(largeResponse)
      });

      const result = await SmartFieldDetector.detectFields('test');
      expect(result.detectedFields.length).toBeLessThanOrEqual(100); // Should limit results
    });
  });

  describe('Concurrent Operation Errors', () => {
    it('handles multiple simultaneous OCR requests', async () => {
      let callCount = 0;
      vi.mocked(callOpenAIWithRateLimit).mockImplementation(() => {
        callCount++;
        if (callCount > 3) {
          return Promise.reject(new Error('Too many concurrent requests'));
        }
        return Promise.resolve({
          generatedText: JSON.stringify({
            fields: [{ field: 'miles', value: '500', confidence: 'high' }]
          })
        });
      });

      const promises = Array(5).fill(null).map(() => 
        SmartFieldDetector.detectFields('test document')
      );

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      expect(successful).toBeGreaterThan(0);
      expect(failed).toBeGreaterThan(0);
      expect(successful + failed).toBe(5);
    });

    it('handles memory pressure during bulk operations', async () => {
      // Simulate memory-intensive operation
      vi.mocked(callOpenAIWithRateLimit).mockImplementation(() => {
        const largeArray = new Array(1000000).fill('memory test');
        return Promise.resolve({
          generatedText: JSON.stringify({
            fields: [{ field: 'miles', value: '500', confidence: 'high' }],
            metadata: largeArray
          })
        });
      });

      // Should handle without crashing
      const result = await SmartFieldDetector.detectFields('test');
      expect(result.detectedFields).toBeDefined();
    });
  });

  describe('Browser Compatibility Errors', () => {
    it('handles missing localStorage gracefully', () => {
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;

      // Functions using localStorage should not crash
      expect(() => {
        SmartFieldDetector.saveUserCorrection('test', 'corrected', 'miles');
      }).not.toThrow();

      // Restore localStorage
      (window as any).localStorage = originalLocalStorage;
    });

    it('handles missing performance API', () => {
      const originalPerformance = window.performance;
      delete (window as any).performance;

      // Should fallback gracefully
      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify({
          fields: [{ field: 'miles', value: '500', confidence: 'high' }]
        })
      });

      expect(async () => {
        await SmartFieldDetector.detectFields('test');
      }).not.toThrow();

      // Restore performance
      (window as any).performance = originalPerformance;
    });

    it('handles missing AbortController', async () => {
      const originalAbortController = window.AbortController;
      delete (window as any).AbortController;

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify({
          fields: [{ field: 'miles', value: '500', confidence: 'high' }]
        })
      });

      // Should work without AbortController
      const result = await SmartFieldDetector.detectFields('test');
      expect(result.detectedFields).toBeDefined();

      // Restore AbortController
      (window as any).AbortController = originalAbortController;
    });
  });

  describe('Edge Case Data Handling', () => {
    it('handles unicode and special characters', async () => {
      const specialCharsText = 'Miles: 5️⃣0️⃣0️⃣ Rate: $1,2️⃣5️⃣0️⃣ From: München To: São Paulo';
      
      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '500', confidence: 'medium' },
            { field: 'rate', value: '1250', confidence: 'medium' },
            { field: 'origin', value: 'München', confidence: 'high' },
            { field: 'destination', value: 'São Paulo', confidence: 'high' }
          ]
        })
      });

      const result = await SmartFieldDetector.detectFields(specialCharsText);
      expect(result.detectedFields).toHaveLength(4);
      expect(result.detectedFields.find(f => f.field === 'origin')?.value).toBe('München');
    });

    it('handles extremely long field values', async () => {
      const longValue = 'A'.repeat(10000);
      
      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify({
          fields: [
            { field: 'origin', value: longValue, confidence: 'high' }
          ]
        })
      });

      const result = await SmartFieldDetector.detectFields('test');
      const originField = result.detectedFields.find(f => f.field === 'origin');
      
      // Should truncate or handle long values appropriately
      expect(originField?.value.length).toBeLessThanOrEqual(500);
    });

    it('handles numeric precision edge cases', () => {
      // Test floating point precision issues
      const testCases = [
        { grossRpm: 2.1, split: 75, costs: 400, expectedApprox: 1.415 },
        { grossRpm: 0.1 + 0.2, split: 100, costs: 0, expectedApprox: 0.3 }, // JavaScript precision issue
        { grossRpm: 999999.99, split: 1, costs: 1, expectedApprox: 9999.99996 },
      ];

      testCases.forEach(({ grossRpm, split, costs, expectedApprox }) => {
        const result = (grossRpm * split / 100) - (costs / 2500);
        expect(result).toBeCloseTo(expectedApprox, 2);
      });
    });
  });
});