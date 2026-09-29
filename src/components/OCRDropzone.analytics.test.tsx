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

  it('emits screenshot_uploaded once for one successful upload/apply flow', async () => {
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


  it('combines multiple images into one apply flow and tracks the batch once', async () => {
    const onParse = vi.fn();
    invokeMock
      .mockResolvedValueOnce({
        data: { origin: 'Atlanta, GA', destination: 'Laredo, TX', confidence: 0.95 },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { miles: '1048', rate: '1750', fsc: '300', confidence: 0.91 },
        error: null,
      });

    const { container } = render(<OCRDropzone onParse={onParse} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const first = new File(['one'], 'dispatch.png', { type: 'image/png' });
    const second = new File(['two'], 'rate.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [first, second] } });

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(2));
    expect(trackScreenshotUploadedMock).toHaveBeenCalledTimes(1);

    fireEvent.click(await screen.findByRole('button', { name: 'Apply to form' }));
    expect(onParse).toHaveBeenCalledWith(expect.objectContaining({
      origin: 'Atlanta, GA',
      destination: 'Laredo, TX',
      miles: '1048',
      rate: '1750',
      fsc: '300',
    }));
  });
});
