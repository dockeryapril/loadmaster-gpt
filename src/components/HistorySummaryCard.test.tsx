import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HistorySummaryCard } from './HistorySummaryCard';
import type { LoadEntrySnapshot } from '@/types/mvp';

describe('HistorySummaryCard', () => {
  const now = new Date('2025-10-08T12:00:00Z');
  
  // Helper to create entries with relative dates
  const createEntry = (daysAgo: number, outcome: 'book' | 'counter' | 'pass', profit: number, rpm: number): LoadEntrySnapshot => ({
    id: `${daysAgo}-${outcome}`,
    createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    outcome,
    origin: 'Origin',
    destination: 'Destination',
    miles: 100,
    rate: 1000,
    fsc: 50,
    tolls: 10,
    fuelCost: 100,
    profit,
    rpm,
  });

  it('should not render when there are no entries in last 7 days', () => {
    const oldHistory: LoadEntrySnapshot[] = [
      createEntry(10, 'book', 500, 2.0), // 10 days ago
      createEntry(15, 'pass', 300, 1.5), // 15 days ago
    ];

    const { container } = render(<HistorySummaryCard history={oldHistory} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render weekly summary for entries within last 7 days', () => {
    const recentHistory: LoadEntrySnapshot[] = [
      createEntry(1, 'book', 500, 2.0),
      createEntry(2, 'book', 600, 2.2),
      createEntry(3, 'counter', 400, 1.8),
      createEntry(4, 'pass', 200, 1.0),
    ];

    const { getByText } = render(<HistorySummaryCard history={recentHistory} />);
    
    expect(getByText('Last 7 days')).toBeInTheDocument();
  });

  it('should count booked entries correctly', () => {
    const history: LoadEntrySnapshot[] = [
      createEntry(1, 'book', 500, 2.0),
      createEntry(2, 'book', 600, 2.2),
      createEntry(3, 'pass', 200, 1.0),
    ];

    const { getByText } = render(<HistorySummaryCard history={history} />);
    
    expect(getByText('2')).toBeInTheDocument(); // 2 booked
  });

  it('should count countered entries correctly', () => {
    const history: LoadEntrySnapshot[] = [
      createEntry(1, 'counter', 400, 1.8),
      createEntry(2, 'counter', 450, 1.9),
      createEntry(3, 'book', 500, 2.0),
    ];

    const { getByText } = render(<HistorySummaryCard history={history} />);
    
    expect(getByText('2')).toBeInTheDocument(); // 2 countered
  });

  it('should count passed entries correctly', () => {
    const history: LoadEntrySnapshot[] = [
      createEntry(1, 'pass', 200, 1.0),
      createEntry(2, 'pass', 150, 0.8),
      createEntry(3, 'pass', 100, 0.5),
      createEntry(4, 'book', 500, 2.0),
    ];

    const { getByText } = render(<HistorySummaryCard history={history} />);
    
    expect(getByText('3')).toBeInTheDocument(); // 3 passed
  });

  it('should calculate average profit for booked loads', () => {
    const history: LoadEntrySnapshot[] = [
      createEntry(1, 'book', 600, 2.0),
      createEntry(2, 'book', 400, 1.5),
      createEntry(3, 'pass', 100, 0.5), // Should not be included in avg profit
    ];

    const { getByText } = render(<HistorySummaryCard history={history} />);
    
    // Average of 600 and 400 is 500
    expect(getByText('$500')).toBeInTheDocument();
  });

  it('should show best RPM from all outcomes', () => {
    const history: LoadEntrySnapshot[] = [
      createEntry(1, 'book', 500, 2.5),
      createEntry(2, 'counter', 400, 2.8), // Best RPM
      createEntry(3, 'pass', 300, 2.0),
    ];

    const { getByText } = render(<HistorySummaryCard history={history} />);
    
    expect(getByText('2.8 /mi')).toBeInTheDocument();
  });

  it('should handle mixed outcomes within 7 days', () => {
    const history: LoadEntrySnapshot[] = [
      createEntry(0, 'book', 700, 2.5),
      createEntry(2, 'counter', 500, 2.0),
      createEntry(4, 'pass', 200, 1.0),
      createEntry(6, 'book', 800, 2.8),
    ];

    const { getByText } = render(<HistorySummaryCard history={history} />);
    
    expect(getByText('2')).toBeInTheDocument(); // 2 booked
    expect(getByText('1')).toBeInTheDocument(); // 1 countered (and 1 passed)
    
    // Average profit of booked loads: (700 + 800) / 2 = 750
    expect(getByText('$750')).toBeInTheDocument();
    
    // Best RPM: 2.8
    expect(getByText('2.8 /mi')).toBeInTheDocument();
  });

  it('should only include entries from last 7 days, excluding older ones', () => {
    const history: LoadEntrySnapshot[] = [
      createEntry(1, 'book', 500, 2.0), // Within 7 days
      createEntry(8, 'book', 600, 2.2), // 8 days ago - excluded
      createEntry(15, 'pass', 200, 1.0), // 15 days ago - excluded
    ];

    const { getByText } = render(<HistorySummaryCard history={history} />);
    
    // Should only count 1 booked entry
    expect(getByText('1')).toBeInTheDocument();
  });
});
