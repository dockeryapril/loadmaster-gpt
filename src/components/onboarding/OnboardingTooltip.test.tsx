import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { OnboardingTooltip } from './OnboardingTooltip';

describe('OnboardingTooltip', () => {
  const mockOnNext = vi.fn();
  const mockOnSkip = vi.fn();

  const defaultProps = {
    step: 1,
    currentStep: 1,
    title: 'Test Title',
    description: 'Test Description',
    selector: '[data-test="target"]',
    onNext: mockOnNext,
    onSkip: mockOnSkip,
  };

  beforeEach(() => {
    // Create a test element in the DOM
    const testElement = document.createElement('div');
    testElement.setAttribute('data-test', 'target');
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    cleanup();
    // Clean up
    document.body.innerHTML = '';
  });

  it('should not render when step is not active', () => {
    const { container } = render(
      <OnboardingTooltip {...defaultProps} currentStep={2} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render tooltip when step is active', () => {
    const { getByText } = render(
      <OnboardingTooltip {...defaultProps} />
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
    expect(getByText('Step 1 of 3')).toBeTruthy();
  });

  it('should show "Next" button for non-final steps', () => {
    const { getByText } = render(
      <OnboardingTooltip {...defaultProps} step={1} />
    );

    expect(getByText('Next')).toBeTruthy();
  });

  it('should show "Done" button for final step', () => {
    const { getByText } = render(
      <OnboardingTooltip {...defaultProps} step={3} currentStep={3} />
    );

    expect(getByText('Done')).toBeTruthy();
  });

  it('should display correct step indicator', () => {
    const { getByText } = render(
      <OnboardingTooltip {...defaultProps} step={2} currentStep={2} />
    );

    expect(getByText('Step 2 of 3')).toBeTruthy();
  });
});
