import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { PatternInsights } from './PatternInsights';
import { useDecisionStore } from '@/store/useDecisionStore';
import { LoadEntrySnapshot } from '@/types/mvp';

describe('PatternInsights', () => {
  beforeEach(() => {
    useDecisionStore.setState({ history: [] });
  });

  it('should render nothing when no decisions', () => {
    const { container } = render(<PatternInsights />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when less than 5 decisions', () => {
    const history: LoadEntrySnapshot[] = [
      {
        id: '1',
        origin: 'A',
        destination: 'B',
        miles: 100,
        rate: 200,
        fsc: 0,
        tolls: 0,
        fuelCost: 50,
        profit: 150,
        rpm: 1.5,
        outcome: 'book',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        origin: 'C',
        destination: 'D',
        miles: 100,
        rate: 180,
        fsc: 0,
        tolls: 0,
        fuelCost: 50,
        profit: 130,
        rpm: 1.3,
        outcome: 'pass',
        createdAt: new Date().toISOString(),
      },
    ];

    useDecisionStore.setState({ history });
    
    const { container } = render(<PatternInsights />);
    expect(container.firstChild).toBeNull();
  });

  it('should render insights when 5+ decisions', () => {
    const history: LoadEntrySnapshot[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      origin: 'Chicago',
      destination: 'Detroit',
      miles: 280,
      rate: 700,
      fsc: 50,
      tolls: 30,
      fuelCost: 120,
      profit: 600,
      rpm: 2.14,
      outcome: 'book' as const,
      createdAt: new Date().toISOString(),
    }));

    useDecisionStore.setState({ history });
    
    const { getByText } = render(<PatternInsights />);

    expect(getByText('Your Decision Patterns')).toBeDefined();
    expect(getByText(/5 logged decisions/)).toBeDefined();
  });

  it('should display best RPM', () => {
    const history: LoadEntrySnapshot[] = [
      ...Array.from({ length: 3 }, (_, i) => ({
        id: String(i + 1),
        origin: 'A',
        destination: 'B',
        miles: 100,
        rate: 200,
        fsc: 0,
        tolls: 0,
        fuelCost: 50,
        profit: 150,
        rpm: 1.5,
        outcome: 'book' as const,
        createdAt: new Date().toISOString(),
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        id: String(i + 4),
        origin: 'C',
        destination: 'D',
        miles: 100,
        rate: 300,
        fsc: 0,
        tolls: 0,
        fuelCost: 50,
        profit: 250,
        rpm: 2.5,
        outcome: 'book' as const,
        createdAt: new Date().toISOString(),
      })),
    ];

    useDecisionStore.setState({ history });
    
    const { getByText } = render(<PatternInsights />);

    expect(getByText('$2.50')).toBeDefined();
  });

  it('should display average profit', () => {
    const history: LoadEntrySnapshot[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      origin: 'A',
      destination: 'B',
      miles: 100,
      rate: 200,
      fsc: 0,
      tolls: 0,
      fuelCost: 50,
      profit: 400,
      rpm: 2.0,
      outcome: 'book' as const,
      createdAt: new Date().toISOString(),
    }));

    useDecisionStore.setState({ history });
    
    const { getByText } = render(<PatternInsights />);

    expect(getByText('$400')).toBeDefined();
  });

  it('should display booking rate', () => {
    const history: LoadEntrySnapshot[] = [
      ...Array.from({ length: 3 }, (_, i) => ({
        id: String(i + 1),
        origin: 'A',
        destination: 'B',
        miles: 100,
        rate: 200,
        fsc: 0,
        tolls: 0,
        fuelCost: 50,
        profit: 150,
        rpm: 1.5,
        outcome: 'book' as const,
        createdAt: new Date().toISOString(),
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        id: String(i + 4),
        origin: 'C',
        destination: 'D',
        miles: 100,
        rate: 150,
        fsc: 0,
        tolls: 0,
        fuelCost: 50,
        profit: 100,
        rpm: 1.0,
        outcome: 'pass' as const,
        createdAt: new Date().toISOString(),
      })),
    ];

    useDecisionStore.setState({ history });
    
    const { getByText } = render(<PatternInsights />);

    expect(getByText('60%')).toBeDefined();
  });

  it('should display most common route', () => {
    const history: LoadEntrySnapshot[] = [
      ...Array.from({ length: 3 }, (_, i) => ({
        id: String(i + 1),
        origin: 'Chicago',
        destination: 'Detroit',
        miles: 280,
        rate: 700,
        fsc: 50,
        tolls: 30,
        fuelCost: 120,
        profit: 600,
        rpm: 2.14,
        outcome: 'book' as const,
        createdAt: new Date().toISOString(),
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        id: String(i + 4),
        origin: 'Detroit',
        destination: 'Cleveland',
        miles: 170,
        rate: 400,
        fsc: 30,
        tolls: 20,
        fuelCost: 70,
        profit: 340,
        rpm: 2.0,
        outcome: 'book' as const,
        createdAt: new Date().toISOString(),
      })),
    ];

    useDecisionStore.setState({ history });
    
    const { getByText } = render(<PatternInsights />);

    expect(getByText('Chicago → Detroit')).toBeDefined();
  });

  it('should display RPM range breakdown with acceptance rates', () => {
    const history: LoadEntrySnapshot[] = [
      {
        id: '1',
        origin: 'A',
        destination: 'B',
        miles: 100,
        rate: 80,
        fsc: 0,
        tolls: 0,
        fuelCost: 50,
        profit: 30,
        rpm: 0.8,
        outcome: 'pass',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        origin: 'C',
        destination: 'D',
        miles: 100,
        rate: 130,
        fsc: 0,
        tolls: 0,
        fuelCost: 50,
        profit: 80,
        rpm: 1.3,
        outcome: 'counter',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        origin: 'E',
        destination: 'F',
        miles: 100,
        rate: 180,
        fsc: 0,
        tolls: 0,
        fuelCost: 50,
        profit: 130,
        rpm: 1.8,
        outcome: 'book',
        createdAt: new Date().toISOString(),
      },
      {
        id: '4',
        origin: 'G',
        destination: 'H',
        miles: 100,
        rate: 220,
        fsc: 0,
        tolls: 0,
        fuelCost: 50,
        profit: 170,
        rpm: 2.2,
        outcome: 'book',
        createdAt: new Date().toISOString(),
      },
      {
        id: '5',
        origin: 'I',
        destination: 'J',
        miles: 100,
        rate: 260,
        fsc: 0,
        tolls: 0,
        fuelCost: 50,
        profit: 210,
        rpm: 2.6,
        outcome: 'book',
        createdAt: new Date().toISOString(),
      },
    ];

    useDecisionStore.setState({ history });
    
    const { getByText } = render(<PatternInsights />);

    expect(getByText('Acceptance by RPM Range')).toBeDefined();
    expect(getByText('$0.00-$1.00/mi')).toBeDefined();
    expect(getByText('$1.50-$2.00/mi')).toBeDefined();
  });
});
