import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OCRDropzone } from './OCRDropzone';

const invokeMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());
const trackScreenshotUploadedMock = vi.hoisted(() => vi.fn());

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock('@/utils/analytics', () => ({
  trackScreenshotUploaded: trackScreenshotUploadedMock,
}));

describe('OCRDropzone analytics guardrail', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    toastMock.mockReset();
    trackScreenshotUploadedMock.mockReset();
  });

  it('emits screenshot_uploaded at most once for one successful upload/apply flow', async () => {
    const onParse = vi.fn();
    invokeMock.mockResolvedValue({
      data: {
        origin: 'Chicago, IL',
        destination: 'Atlanta, GA',
        miles: '700',
        rate: '1600',
        confidence: 0.95,
      },
      error: null,
    });

    const { container } = render(<OCRDropzone onParse={onParse} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['fake-image'], 'ratecon.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(trackScreenshotUploadedMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Apply to form' }));

    expect(onParse).toHaveBeenCalledTimes(1);
    expect(trackScreenshotUploadedMock).toHaveBeenCalledTimes(1);
  });
});
