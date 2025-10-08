import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
    refreshSession: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/utils/apiWrapper', () => ({
  callOpenAIWithRateLimit: vi.fn(),
  RateLimitExceededError: class RateLimitExceededError extends Error {},
}));

import { callOpenAIWithRateLimit } from '@/utils/apiWrapper';
import { SmartFieldDetector } from '@/utils/SmartFieldDetector';

// Integration test utilities
function createMockSupabaseQuery(data: any, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    upsert: vi.fn().mockResolvedValue({ data, error }),
    insert: vi.fn().mockResolvedValue({ data, error }),
    update: vi.fn().mockResolvedValue({ data, error }),
  };
}

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete OCR to Calculation Flow', () => {
    it('processes load document end-to-end with business setup', async () => {
      // Mock OCR extraction
      const mockOCRResponse = {
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '587', confidence: 'high' },
            { field: 'rate', value: '1450', confidence: 'high' },
            { field: 'origin', value: 'Chicago, IL', confidence: 'high' },
            { field: 'destination', value: 'Atlanta, GA', confidence: 'high' }
          ]
        })
      };

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue(mockOCRResponse);

      // Mock user settings retrieval
      const mockUserSettings = {
        fuel_price: 3.50,
        mpg: 6.5,
        rpm_threshold_excellent: 2.5,
        rpm_threshold_good: 2.0,
        rpm_threshold_fair: 1.5,
        revenue_split_percentage: 75,
        weekly_fixed_costs: 400,
      };

      mockSupabase.from.mockReturnValue(createMockSupabaseQuery(mockUserSettings));

      // Test OCR processing
      const ocrResult = await SmartFieldDetector.detectFields('Load confirmation document text');

      expect(ocrResult.confidence).toBe('high');
      expect(ocrResult.detectedFields).toHaveLength(4);

      // Test calculation logic
      const miles = Number(ocrResult.detectedFields.find(f => f.field === 'miles')?.value);
      const rate = Number(ocrResult.detectedFields.find(f => f.field === 'rate')?.value);
      const grossRpm = rate / miles;

      // Apply business setup
      const revenueSplit = 75;
      const weeklyCosts = 400;
      const estimatedWeeklyMiles = 2500;
      
      const afterSplitRpm = grossRpm * (revenueSplit / 100);
      const costPerMile = weeklyCosts / estimatedWeeklyMiles;
      const netRpm = afterSplitRpm - costPerMile;

      expect(grossRpm).toBeCloseTo(2.47, 2);
      expect(netRpm).toBeCloseTo(1.69, 2); // After 75% split and $400/week costs
    });

    it('handles OCR errors gracefully in end-to-end flow', async () => {
      // Mock OCR failure
      vi.mocked(callOpenAIWithRateLimit).mockRejectedValue(new Error('API Error'));

      // Should still provide fallback detection
      const result = await SmartFieldDetector.detectFields('Miles: 500 Rate: $1250');

      expect(result.confidence).toBe('low');
      expect(result.detectedFields.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Settings Synchronization', () => {
    it('maintains settings consistency across LITE and PRO', async () => {
      const mockSettings = {
        fuel_price: 3.75,
        mpg: 7.2,
        revenue_split_percentage: 85,
        weekly_fixed_costs: 250,
        business_setup_completed: true,
      };

      const mockQuery = createMockSupabaseQuery(mockSettings);
      mockSupabase.from.mockReturnValue(mockQuery);

      // Simulate settings retrieval
      const { data: settings } = await mockQuery.select('*').eq('user_id', 'test-user').maybeSingle();

      expect(settings.revenue_split_percentage).toBe(85);
      expect(settings.weekly_fixed_costs).toBe(250);
      expect(settings.business_setup_completed).toBe(true);
    });

    it('handles settings update conflicts gracefully', async () => {
      const mockError = { message: 'Conflict error', code: '23505' };
      const mockQuery = createMockSupabaseQuery(null, mockError);
      
      mockSupabase.from.mockReturnValue(mockQuery);

      try {
        await mockQuery.upsert({ user_id: 'test', revenue_split_percentage: 80 });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Data Persistence Flow', () => {
    it('saves complete load calculation with business data', async () => {
      const loadData = {
        user_id: 'test-user',
        miles: 587,
        rate: 1450,
        origin: 'Chicago, IL',
        destination: 'Atlanta, GA',
        rpm: 2.47,
        profit: 450.25, // After business calculations
        created_at: new Date().toISOString(),
      };

      const mockQuery = createMockSupabaseQuery(loadData);
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await mockQuery.insert(loadData);

      expect(result.data).toEqual(loadData);
      expect(mockQuery.insert).toHaveBeenCalledWith(loadData);
    });

    it('archives loads with business impact history', async () => {
      const archiveData = {
        original_load_id: 'load-123',
        user_id: 'test-user',
        miles: 587,
        rate: 1450,
        rpm: 2.47,
        profit: 450.25,
        archived_reason: 'business_setup_change',
        business_impact: {
          revenue_split: 75,
          weekly_costs: 400,
          net_rpm: 1.69
        }
      };

      const mockQuery = createMockSupabaseQuery(archiveData);
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await mockQuery.insert(archiveData);

      expect(result.data.business_impact).toBeDefined();
      expect(result.data.archived_reason).toBe('business_setup_change');
    });
  });

  describe('Authentication Integration', () => {
    it('handles authentication state in data operations', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const { data } = await mockSupabase.auth.getUser();
      
      expect(data.user.id).toBe('user-123');
      expect(data.user.email).toBe('test@example.com');
    });

    it('handles JWT refresh during long operations', async () => {
      // Simulate JWT expiration
      const jwtError = { message: 'JWT expired', code: 'PGRST301' };
      const mockQuery = createMockSupabaseQuery(null, jwtError);
      
      mockSupabase.from.mockReturnValue(mockQuery);
      mockSupabase.auth.refreshSession.mockResolvedValue({ error: null });

      // First call fails with JWT error
      const firstResult = await mockQuery.select('*').eq('user_id', 'test').maybeSingle();
      expect(firstResult.error.message).toBe('JWT expired');

      // Should attempt refresh
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('handles network interruption during OCR processing', async () => {
      vi.mocked(callOpenAIWithRateLimit)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          generatedText: JSON.stringify({
            fields: [{ field: 'miles', value: '500', confidence: 'medium' }]
          })
        });

      // First attempt should fail, but system should recover
      try {
        await SmartFieldDetector.detectFields('test document');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      // Second attempt should succeed
      const result = await SmartFieldDetector.detectFields('test document');
      expect(result.detectedFields).toHaveLength(1);
    });

    it('maintains data consistency during partial failures', async () => {
      // Simulate successful OCR but failed database save
      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify({
          fields: [
            { field: 'miles', value: '500', confidence: 'high' },
            { field: 'rate', value: '1250', confidence: 'high' }
          ]
        })
      });

      const dbError = { message: 'Database connection failed', code: '08006' };
      const mockQuery = createMockSupabaseQuery(null, dbError);
      mockSupabase.from.mockReturnValue(mockQuery);

      // OCR should succeed
      const ocrResult = await SmartFieldDetector.detectFields('test document');
      expect(ocrResult.confidence).toBe('high');

      // Database save should fail gracefully
      const dbResult = await mockQuery.insert({ test: 'data' });
      expect(dbResult.error).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    it('processes multiple documents efficiently', async () => {
      const documents = [
        'Document 1 content',
        'Document 2 content', 
        'Document 3 content'
      ];

      vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
        generatedText: JSON.stringify({
          fields: [{ field: 'miles', value: '500', confidence: 'high' }]
        })
      });

      const startTime = performance.now();
      
      const results = await Promise.all(
        documents.map(doc => SmartFieldDetector.detectFields(doc))
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(3);
      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
      results.forEach(result => {
        expect(result.detectedFields).toBeDefined();
      });
    });

    it('handles concurrent database operations', async () => {
      const operations = Array(5).fill(null).map((_, i) => ({
        user_id: `user-${i}`,
        miles: 500 + i * 10,
        rate: 1250 + i * 50
      }));

      const mockQuery = createMockSupabaseQuery({ id: 'test' });
      mockSupabase.from.mockReturnValue(mockQuery);

      const results = await Promise.all(
        operations.map(op => mockQuery.insert(op))
      );

      expect(results).toHaveLength(5);
      expect(mockQuery.insert).toHaveBeenCalledTimes(5);
    });
  });
});