import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingTooltip } from './OnboardingTooltip';

describe('OnboardingTooltip', () => {
  const mockOnNext = vi.fn();
  const mockOnSkip = vi.fn();

  const defaultProps = {
    step: 1,
    currentStep: 1,
    title: 'Test Title',
    description: 'Test Description',
    onNext: mockOnNext,
    onSkip: mockOnSkip,
  };

  it('should render children when step is not active', () => {
    render(
      <OnboardingTooltip {...defaultProps} currentStep={2}>
        <div data-testid="child">Child Content</div>
      </OnboardingTooltip>
    );

    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('should render tooltip content when step is active', () => {
    render(
      <OnboardingTooltip {...defaultProps}>
        <div data-testid="child">Child Content</div>
      </OnboardingTooltip>
    );

    expect(screen.getByText('Test Title')).toBeTruthy();
    expect(screen.getByText('Test Description')).toBeTruthy();
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
  });

  it('should show "Next" button for non-final steps', () => {
    render(
      <OnboardingTooltip {...defaultProps} step={1}>
        <div>Child</div>
      </OnboardingTooltip>
    );

    expect(screen.getByText('Next')).toBeTruthy();
  });

  it('should show "Done" button for final step', () => {
    render(
      <OnboardingTooltip {...defaultProps} step={3} currentStep={3}>
        <div>Child</div>
      </OnboardingTooltip>
    );

    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('should display correct step indicator', () => {
    render(
      <OnboardingTooltip {...defaultProps} step={2} currentStep={2}>
        <div>Child</div>
      </OnboardingTooltip>
    );

    expect(screen.getByText('Step 2 of 3')).toBeTruthy();
  });
});
