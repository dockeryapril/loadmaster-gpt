import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import type { LoadFormInput } from '@/types/mvp';

interface OCRDropzoneProps {
  onParse: (data: Partial<LoadFormInput>) => void;
  disabled?: boolean;
}

const runOcr = async (file: File) => {
  const tesseract = await import('tesseract.js');
  const result = await tesseract.recognize(file, 'eng');
  return result.data.text;
};

export function OCRDropzone({ onParse, disabled }: OCRDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');

  const processText = useCallback(
    (text: string) => {
      // Placeholder: OCR parsing deferred to Phase 3+
      setStatus('Text captured. Manual entry required for now.');
      // In Phase 3+, this will call parseRateCon or similar
    },
    [onParse],
  );

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setIsLoading(true);
      setError(null);
      setStatus('Running OCR...');
      try {
        const text = await runOcr(file);
        setManualText(text.trim());
        processText(text);
      } catch (err) {
        console.error(err);
        setError('Unable to read the file. Try a clearer image or paste the text manually.');
      } finally {
        setIsLoading(false);
      }
    },
    [processText],
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

  const handleManualParse = useCallback(() => {
    if (!manualText.trim()) {
      setError('Paste some text before parsing.');
      return;
    }
    setError(null);
    processText(manualText);
  }, [manualText, processText]);

  const borderClasses = disabled
    ? 'border-muted'
    : isDragging
      ? 'border-primary bg-primary/10'
      : 'border-dashed border-muted-foreground/40';

  return (
    <div className="space-y-3">
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
          Browse files
        </button>
        <p className="mt-3 text-xs text-muted-foreground">Supported: JPG, PNG. Keep text clear for best results.</p>
        {isLoading && <p className="mt-3 text-sm text-primary">Scanning...</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Rate confirmation text</label>
        <textarea
          value={manualText}
          onChange={(event) => setManualText(event.target.value)}
          rows={6}
          className="w-full rounded-lg border border-muted bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          placeholder="Paste the OCR output or copy + paste rate confirmation text here"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleManualParse}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            disabled={disabled || isLoading}
          >
            Parse text
          </button>
          {status && <span className="text-xs text-muted-foreground">{status}</span>}
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      </div>
    </div>
  );
}
