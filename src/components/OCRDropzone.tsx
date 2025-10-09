import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { FunctionsFetchError } from '@supabase/supabase-js';
import type { LoadFormInput } from '@/types/mvp';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OCRDropzoneProps {
  onParse: (data: Partial<LoadFormInput>) => void;
  disabled?: boolean;
}

interface ExtractedData {
  origin?: string;
  destination?: string;
  miles?: string;
  rate?: string;
  fsc?: string;
  tolls?: string;
  weight?: string;
  loadReference?: string;
  confidence?: number;
  error?: string;
  message?: string;
}

export function OCRDropzone({ onParse, disabled }: OCRDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const { toast } = useToast();

  const processImage = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setExtractedData(null);

      try {
        const formData = new FormData();
        formData.append('file', file, file.name);

        const { data, error } = await supabase.functions.invoke('extract-load-data', {
          body: formData,
        });

        if (error) {
          console.error('Edge function error:', error);

          if (error instanceof FunctionsFetchError || error.message?.includes('Failed to send a request')) {
            toast({
              variant: 'destructive',
              title: 'Connection issue',
              description: 'We could not reach the OCR service. Check your connection or try a smaller image.',
            });
            return;
          }

          // Handle specific error types
          if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
            toast({
              variant: 'destructive',
              title: 'Too many requests',
              description: 'Please wait a moment before trying again, or enter data manually.',
            });
            return;
          }
          
          if (error.message?.includes('payment_required') || error.message?.includes('402')) {
            toast({
              variant: 'destructive',
              title: 'AI credits depleted',
              description: 'Manual entry is always available!',
            });
            return;
          }
          
          throw new Error(error.message || 'OCR extraction failed');
        }

        if (data?.error) {
          console.error('Extraction error:', data.message);
          toast({
            variant: 'destructive',
            title: 'Could not extract data',
            description: data.message || 'Try a clearer image or enter data manually.',
          });
          return;
        }

        console.log('Extracted data:', data);
        setExtractedData(data);

        // Show warning for low confidence
        if (data.confidence && data.confidence < 0.7) {
          toast({
            title: '⚠️ Low confidence',
            description: 'Please review the extracted fields carefully before applying.',
          });
        } else {
          toast({
            title: '✨ Data extracted',
            description: 'Review and apply the extracted fields to your form.',
          });
        }

      } catch (err) {
        console.error('OCR processing error:', err);
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: err instanceof Error ? err.message : 'Try a clearer image or enter data manually.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid file',
          description: 'Please upload an image file (JPG, PNG, WEBP).',
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload an image smaller than 10MB.',
        });
        return;
      }
      
      await processImage(file);
    },
    [processImage, toast],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled) return;
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      void handleFile(file || null);
    },
    [disabled, handleFile],
  );

  const onDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      void handleFile(file);
      event.target.value = '';
    },
    [handleFile],
  );

  const handleApply = useCallback(() => {
    if (!extractedData) return;
    
    onParse({
      origin: extractedData.origin || '',
      destination: extractedData.destination || '',
      miles: extractedData.miles || '',
      rate: extractedData.rate || '',
      fsc: extractedData.fsc || '',
      tolls: extractedData.tolls || '',
      notes: extractedData.loadReference 
        ? `Load ref: ${extractedData.loadReference}` 
        : '',
    });
    
    setExtractedData(null);
    
    toast({
      title: '✓ Fields applied',
      description: 'Form has been auto-filled with extracted data.',
    });
  }, [extractedData, onParse, toast]);

  const handleCancel = useCallback(() => {
    setExtractedData(null);
  }, []);

  const borderClasses = disabled
    ? 'border-muted'
    : isDragging
      ? 'border-primary bg-primary/10'
      : 'border-dashed border-muted-foreground/40';

  return (
    <div className="space-y-3">
      {!extractedData ? (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`rounded-xl border-2 px-6 py-8 text-center transition-colors ${borderClasses}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
            disabled={disabled || isLoading}
          />
          <p className="text-sm font-semibold">Drop a rate confirmation image</p>
          <p className="mt-2 text-sm text-muted-foreground">or</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 rounded-full border border-primary px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10"
            disabled={disabled || isLoading}
          >
            {isLoading ? 'Scanning...' : 'Browse files'}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            Supported: JPG, PNG, WEBP. Max 10MB.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Extracted fields</p>
            {extractedData.confidence !== undefined && (
              <span 
                className={`text-xs ${
                  extractedData.confidence >= 0.7 
                    ? 'text-green-600' 
                    : 'text-amber-600'
                }`}
              >
                {Math.round(extractedData.confidence * 100)}% confidence
              </span>
            )}
          </div>
          
          <div className="space-y-2 text-sm">
            {extractedData.origin && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Origin:</span>
                <span className="font-medium">{extractedData.origin}</span>
              </div>
            )}
            {extractedData.destination && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination:</span>
                <span className="font-medium">{extractedData.destination}</span>
              </div>
            )}
            {extractedData.miles && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Miles:</span>
                <span className="font-medium">{extractedData.miles}</span>
              </div>
            )}
            {extractedData.rate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-medium">${extractedData.rate}</span>
              </div>
            )}
            {extractedData.fsc && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">FSC:</span>
                <span className="font-medium">${extractedData.fsc}</span>
              </div>
            )}
            {extractedData.tolls && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tolls:</span>
                <span className="font-medium">${extractedData.tolls}</span>
              </div>
            )}
            {extractedData.loadReference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Load ref:</span>
                <span className="font-medium">{extractedData.loadReference}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Apply to form
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
