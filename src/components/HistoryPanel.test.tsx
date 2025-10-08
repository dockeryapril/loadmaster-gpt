import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryPanel } from './HistoryPanel';
import * as useDecisionStoreModule from '@/store/useDecisionStore';
import type { LoadEntrySnapshot } from '@/types/mvp';

// Mock the Zustand store
vi.mock('@/store/useDecisionStore', () => ({
  useDecisionStore: vi.fn(),
  decisionLabels: {
    book: 'Book it',
    pass: 'Pass',
    counter: 'Counter offer',
  },
}));

const mockHistory: LoadEntrySnapshot[] = [
  {
    id: '1',
    createdAt: new Date('2025-10-08T10:00:00Z').toISOString(),
    outcome: 'book',
    origin: 'Chicago, IL',
    destination: 'New York, NY',
    miles: 800,
    rate: 2400,
    fsc: 200,
    tolls: 50,
    fuelCost: 400,
    profit: 2150,
    rpm: 2.69,
  },
  {
    id: '2',
    createdAt: new Date('2025-10-07T12:00:00Z').toISOString(),
    outcome: 'pass',
    origin: 'Los Angeles, CA',
    destination: 'Phoenix, AZ',
    miles: 400,
    rate: 600,
    fsc: 50,
    tolls: 0,
    fuelCost: 200,
    profit: 450,
    rpm: 1.13,
    notes: 'Rate too low',
  },
];

describe('HistoryPanel', () => {
  const mockClearHistory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when there is no history', () => {
    vi.spyOn(useDecisionStoreModule, 'useDecisionStore').mockImplementation((selector: any) => {
      const state = {
        history: [],
        clearHistory: mockClearHistory,
      };
      return selector(state);
    });

    const { getByText } = render(<HistoryPanel />);
    
    expect(getByText(/No decisions logged yet/i)).toBeInTheDocument();
  });

  it('should render history entries', () => {
    vi.spyOn(useDecisionStoreModule, 'useDecisionStore').mockImplementation((selector: any) => {
      const state = {
        history: mockHistory,
        clearHistory: mockClearHistory,
      };
      return selector(state);
    });

    const { getByText } = render(<HistoryPanel />);
    
    expect(getByText('Chicago, IL → New York, NY')).toBeInTheDocument();
    expect(getByText('Los Angeles, CA → Phoenix, AZ')).toBeInTheDocument();
  });

  it('should display decision outcome badges', () => {
    vi.spyOn(useDecisionStoreModule, 'useDecisionStore').mockImplementation((selector: any) => {
      const state = {
        history: mockHistory,
        clearHistory: mockClearHistory,
      };
      return selector(state);
    });

    const { getByText } = render(<HistoryPanel />);
    
    expect(getByText('Book it')).toBeInTheDocument();
    expect(getByText('Pass')).toBeInTheDocument();
  });

  it('should display miles, profit, and RPM for each entry', () => {
    vi.spyOn(useDecisionStoreModule, 'useDecisionStore').mockImplementation((selector: any) => {
      const state = {
        history: mockHistory,
        clearHistory: mockClearHistory,
      };
      return selector(state);
    });

    const { getByText } = render(<HistoryPanel />);
    
    expect(getByText('800')).toBeInTheDocument(); // Miles
    expect(getByText('$2,150.00')).toBeInTheDocument(); // Profit
    expect(getByText('2.69 /mi')).toBeInTheDocument(); // RPM
  });

  it('should display notes when present', () => {
    vi.spyOn(useDecisionStoreModule, 'useDecisionStore').mockImplementation((selector: any) => {
      const state = {
        history: mockHistory,
        clearHistory: mockClearHistory,
      };
      return selector(state);
    });

    const { getByText } = render(<HistoryPanel />);
    
    expect(getByText('Rate too low')).toBeInTheDocument();
  });

  it('should call clearHistory when "Clear all" button is clicked', async () => {
    vi.spyOn(useDecisionStoreModule, 'useDecisionStore').mockImplementation((selector: any) => {
      const state = {
        history: mockHistory,
        clearHistory: mockClearHistory,
      };
      return selector(state);
    });

    const { getByText } = render(<HistoryPanel />);
    
    const clearButton = getByText('Clear all');
    await userEvent.click(clearButton);
    
    expect(mockClearHistory).toHaveBeenCalledTimes(1);
  });

  it('should filter entries when outcome filter is changed', async () => {
    vi.spyOn(useDecisionStoreModule, 'useDecisionStore').mockImplementation((selector: any) => {
      const state = {
        history: mockHistory,
        clearHistory: mockClearHistory,
      };
      return selector(state);
    });

    const { getByText, queryByText, getByLabelText } = render(<HistoryPanel />);
    
    const filterSelect = getByLabelText(/Filter by outcome/i);
    await userEvent.selectOptions(filterSelect, 'book');
    
    // Should only show the book entry
    expect(getByText('Chicago, IL → New York, NY')).toBeInTheDocument();
    expect(queryByText('Los Angeles, CA → Phoenix, AZ')).not.toBeInTheDocument();
  });

  it('should show "no results" message when filters return empty', async () => {
    vi.spyOn(useDecisionStoreModule, 'useDecisionStore').mockImplementation((selector: any) => {
      const state = {
        history: mockHistory,
        clearHistory: mockClearHistory,
      };
      return selector(state);
    });

    const { getByText, getByPlaceholderText } = render(<HistoryPanel />);
    
    const searchInput = getByPlaceholderText(/Search origin or destination/i);
    await userEvent.type(searchInput, 'nonexistent city');
    
    expect(getByText(/No results match your filters/i)).toBeInTheDocument();
  });

  it('should paginate entries and show "Load more" button', async () => {
    // Create 15 entries to test pagination (10 per page)
    const manyEntries: LoadEntrySnapshot[] = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      createdAt: new Date(`2025-10-${String(8 - i).padStart(2, '0')}T10:00:00Z`).toISOString(),
      outcome: 'book' as const,
      origin: `Origin ${i}`,
      destination: `Destination ${i}`,
      miles: 100,
      rate: 1000,
      fsc: 50,
      tolls: 10,
      fuelCost: 100,
      profit: 500,
      rpm: 2.0,
    }));

    vi.spyOn(useDecisionStoreModule, 'useDecisionStore').mockImplementation((selector: any) => {
      const state = {
        history: manyEntries,
        clearHistory: mockClearHistory,
      };
      return selector(state);
    });

    const { getByText, queryByText } = render(<HistoryPanel />);
    
    // Should show "Load more" button with remaining count
    expect(getByText(/Load more \(5 remaining\)/i)).toBeInTheDocument();
    
    // Click load more
    const loadMoreButton = getByText(/Load more/i);
    await userEvent.click(loadMoreButton);
    
    // Should now show all entries and no load more button
    expect(queryByText(/Load more/i)).not.toBeInTheDocument();
  });
});
