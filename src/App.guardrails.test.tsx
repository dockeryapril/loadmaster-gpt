import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

const mockFeatures = vi.hoisted(() => ({
  ocrEnabled: true,
  authEnabled: false,
  supabaseSync: false,
  advancedNegotiation: true,
  stripeIntegration: false,
  aiEnhancement: false,
  businessSetup: false,
}));

const mockAuthState = vi.hoisted(() => ({
  user: null as { id: string; email?: string } | null,
}));

const loadFromCloudMock = vi.hoisted(() => vi.fn());
const syncToCloudMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

const storeState = vi.hoisted(() => ({
  history: [] as Array<Record<string, unknown>>,
  addDecision: vi.fn(),
  loadFromCloud: loadFromCloudMock,
  costProfile: {
    fuelPricePerGallon: 3.89,
    averageMPG: 6.5,
    dailyFixedCosts: 250,
    variableCostPerMile: 0.35,
    goodRpm: 0.8,
    fairRpm: 0.7,
    goodProfit: 900,
    fairProfit: 450,
    fuelType: 'diesel' as const,
  },
}));

vi.mock('@/utils/featureFlags', () => ({
  features: mockFeatures,
  isFeatureEnabled: (flag: keyof typeof mockFeatures) => mockFeatures[flag],
}));

vi.mock('@/hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: mockAuthState.user,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCloudSync', () => ({
  useCloudSync: () => ({
    isSyncing: false,
    syncToCloud: syncToCloudMock,
  }),
}));

vi.mock('@/store/useDecisionStore', () => ({
  useDecisionStore: (selector: (state: typeof storeState) => unknown) => selector(storeState),
  useCostProfile: () => ({ costProfile: storeState.costProfile }),
  decisionLabels: { book: 'Book it', pass: 'Pass', counter: 'Counter offer' },
}));

vi.mock('@/types/load', () => ({
  calculateDetailedProfit: () => ({
    profit: 100,
    breakdown: {
      grossRevenue: 200,
      yourShare: 200,
      fuelCost: 20,
      loadedRpm: 1,
      trueRpm: 1,
    },
    adjustments: {
      appliedFsc: 0,
      appliedTolls: 0,
      originalFuelCost: 20,
    },
  }),
}));

vi.mock('@/utils/analytics', () => ({
  trackCalculationSubmitted: vi.fn(),
  trackDecisionLogged: vi.fn(),
  trackSessionStart: vi.fn(),
}));

vi.mock('@/hooks/useNegotiationEngine', () => ({
  useNegotiationEngine: () => ({ calculation: null, templates: [], isReady: false }),
}));

vi.mock('@/components/OCRDropzone', () => ({
  OCRDropzone: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="ocr-dropzone" data-disabled={disabled ? 'true' : 'false'} />
  ),
}));

vi.mock('@/components/CostProfileEditor', () => ({ CostProfileEditor: () => <div /> }));
vi.mock('@/components/ProfitBreakdown', () => ({ ProfitBreakdown: () => <div /> }));
vi.mock('@/components/GuidanceBadge', () => ({ GuidanceBadge: () => <div /> }));
vi.mock('@/components/HistoryPanel', () => ({ HistoryPanel: () => <div /> }));
vi.mock('@/components/PatternInsights', () => ({ PatternInsights: () => <div /> }));
vi.mock('@/components/SimilarLoadIndicator', () => ({ SimilarLoadIndicator: () => <div /> }));
vi.mock('@/components/SyncStatus', () => ({ SyncStatus: () => <div /> }));
vi.mock('@/components/NegotiationMessageSheet', () => ({ NegotiationMessageSheet: () => <div /> }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => <div /> }));
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));
vi.mock('@/pages/Auth', () => ({ default: () => <div>Auth Page</div> }));
vi.mock('@/pages/AdminAnalytics', () => ({ default: () => <div>Admin Page</div> }));

describe('App guardrails', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    mockFeatures.ocrEnabled = true;
    mockFeatures.authEnabled = false;
    mockFeatures.supabaseSync = false;
    mockAuthState.user = null;
    storeState.history = [];
    loadFromCloudMock.mockClear();
    syncToCloudMock.mockClear();
  });

  it('hides OCR entry point when ocrEnabled is false', () => {
    mockFeatures.ocrEnabled = false;
    render(<App />);

    expect(screen.queryByText('Rate confirmation assist')).toBeNull();
    expect(screen.queryByTestId('ocr-dropzone')).toBeNull();
  });

  it('does not invoke load/sync side effects when supabaseSync is false', async () => {
    mockAuthState.user = { id: 'user-1', email: 'driver@example.com' };
    storeState.history = [{ id: '1' }];
    mockFeatures.supabaseSync = false;

    render(<App />);

    await waitFor(() => {
      expect(loadFromCloudMock).not.toHaveBeenCalled();
      expect(syncToCloudMock).not.toHaveBeenCalled();
    });
  });

  it('shows sign-in-required OCR copy and disabled dropzone when unauthenticated', () => {
    mockFeatures.ocrEnabled = true;
    mockAuthState.user = null;

    render(<App />);

    expect(screen.getByText('Sign-in required')).toBeDefined();
    expect(screen.getByText('Sign in to use OCR auto-fill.')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Sign in to use OCR' })).toBeDefined();
    expect(screen.getByTestId('ocr-dropzone').getAttribute('data-disabled')).toBe('true');
  });
});
