import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NegotiationMessageSheet } from './NegotiationMessageSheet';

vi.mock('@/utils/analytics', () => ({
  trackNegotiationOpened: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NegotiationMessageSheet outcome capture', () => {
  const calculation = {
    baseRpm: 1.1,
    effectiveRpm: 1.0,
    loadedMiles: 500,
    deadheadMiles: 50,
    effectiveMiles: 550,
    surcharges: {
      tarp: 0,
      heavyPerMile: 0,
      oversizeWidth: 0,
      oversizeHeight: 0,
      multiStop: 0,
      rush: 0,
      weekend: 0,
      afterHours: 0,
      inside: 0,
      residential: 0,
      liftgate: 0,
      palletJack: 0,
      detentionPerHour: 0,
      access: 0,
      securement: 0,
    },
    negotiation: { anchor: 2000, target: 1850, floor: 1700 },
    resultColor: 'green' as const,
  };

  it('applies accepted ask rate', () => {
    const onApplyOutcome = vi.fn();

    render(
      <NegotiationMessageSheet
        open
        onOpenChange={() => {}}
        calculation={calculation}
        templates={[]}
        onApplyOutcome={onApplyOutcome}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Got Ask Rate' }));
    expect(onApplyOutcome).toHaveBeenCalledWith({ counterResult: 'accepted', finalRate: 2000 });
  });

  it('applies declined without final rate', () => {
    const onApplyOutcome = vi.fn();

    render(
      <NegotiationMessageSheet
        open
        onOpenChange={() => {}}
        calculation={calculation}
        templates={[]}
        onApplyOutcome={onApplyOutcome}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Declined' }));
    expect(onApplyOutcome).toHaveBeenCalledWith({ counterResult: 'declined' });
  });
});
