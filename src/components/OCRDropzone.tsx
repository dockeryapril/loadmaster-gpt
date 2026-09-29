import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { FunctionsFetchError } from "@supabase/supabase-js";
import type { LoadFormInput } from "@/types/mvp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackScreenshotUploaded } from "@/utils/analytics";
import { mergeOcrExtractions, type OcrExtractedData } from "@/utils/mergeOcrExtractions";

interface OCRDropzoneProps {
  onParse?: (data: Partial<LoadFormInput>) => void;
  onExtract?: (data: Partial<LoadFormInput>, sources: Partial<Record<keyof OcrExtractedData, number[]>>) => void;
  disabled?: boolean;
}

interface ExtractedData extends OcrExtractedData {
   error?: string;
  message?: string;
}

export function OCRDropzone({ onParse, onExtract, disabled }: OCRDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [imageCount, setImageCount] = useState(0);
  const [fieldSources, setFieldSources] = useState<Partial<Record<keyof OcrExtractedData, number[]>>>({});
  const [conflicts, setConflicts] = useState<Array<{ field: keyof OcrExtractedData; values: Array<{ value: string; image: number }> }>>([]);
  const { toast } = useToast();

  const processImages = useCallback(
    async (files: File[]) => {
      setIsLoading(true);
      setExtractedData(null);
      setConflicts([]);
      setImageCount(files.length);

      try {
        const results: ExtractedData[] = [];
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file, file.name);
          const { data, error } = await supabase.functions.invoke("extract-load-data", { body: formData });

          if (error) {
            if (error instanceof FunctionsFetchError || error.message?.includes("Failed to send a request")) {
              throw new Error("We could not reach the OCR service. Check your connection or try smaller images.");
            }
            if (error.message?.includes("rate_limit") || error.message?.includes("429")) {
              throw new Error("Too many OCR requests. Please wait a moment and try again.");
            }
            throw new Error(error.message || "OCR extraction failed");
          }
          if (data?.error) throw new Error(data.message || "Could not extract data from one of the images.");
          results.push(data);
        }

        const reconciled = mergeOcrExtractions(results);
        setExtractedData(reconciled.merged);
        setFieldSources(reconciled.sources);
        setConflicts(reconciled.conflicts);
        onExtract?.({
          origin: reconciled.merged.origin || "",
          destination: reconciled.merged.destination || "",
          miles: reconciled.merged.miles || "",
          deadheadMiles: reconciled.merged.deadheadMiles || "",
          rate: reconciled.merged.rate || "",
          fsc: reconciled.merged.fsc || "",
          tolls: reconciled.merged.tolls || "",
        }, reconciled.sources);
        trackScreenshotUploaded();

        toast({
          title: reconciled.conflicts.length ? "⚠️ Review conflicting fields" : "✨ Data extracted",
          description: reconciled.conflicts.length
            ? "LoadMaster found different values across your images and left those fields for you to verify."
            : `Combined data from ${files.length} image${files.length === 1 ? "" : "s"}. Review before applying.`,
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: err instanceof Error ? err.message : "Try clearer images or enter data manually.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, onExtract],
  );

  const handleFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    if (files.length > 5) {
      toast({ variant: "destructive", title: "Too many images", description: "Upload up to 5 images for one offer." });
      return;
    }
    const invalid = files.find((file) => !file.type.startsWith("image/"));
    if (invalid) {
      toast({ variant: "destructive", title: "Invalid file", description: "Please upload image files (JPG, PNG, WEBP)." });
      return;
    }
    const oversized = files.find((file) => file.size > 10 * 1024 * 1024);
    if (oversized) {
      toast({ variant: "destructive", title: "File too large", description: "Each image must be smaller than 10MB." });
      return;
    }
    await processImages(files);
  }, [processImages, toast]);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled) return;
      setIsDragging(false);
      const files = Array.from(event.dataTransfer.files || []);
      void handleFiles(files);
    },
    [disabled, handleFiles],
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
      const files = Array.from(event.target.files || []);
      void handleFiles(files);
      event.target.value = "";
    },
    [handleFiles],
  );

  const handleApply = useCallback(() => {
    if (!extractedData) return;

    onParse?.({
      origin: extractedData.origin || "",
      destination: extractedData.destination || "",
      miles: extractedData.miles || "",
      deadheadMiles: extractedData.deadheadMiles || "",
      rate: extractedData.rate || "",
      fsc: extractedData.fsc || "",
      tolls: extractedData.tolls || "",
      notes: extractedData.loadReference
        ? `Load ref: ${extractedData.loadReference}`
        : "",
    });

    setExtractedData(null);
    setConflicts([]);
    setFieldSources({});

    toast({
      title: "✓ Fields applied",
      description: "Form has been auto-filled with extracted data.",
    });
  }, [extractedData, onParse, toast]);

  const handleCancel = useCallback(() => {
    setExtractedData(null);
    setConflicts([]);
    setFieldSources({});
  }, []);

  const borderClasses = disabled
    ? "border-muted"
    : isDragging
      ? "border-primary bg-primary/10"
      : "border-dashed border-muted-foreground/40";

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
            multiple
            className="hidden"
            onChange={onFileChange}
            disabled={disabled || isLoading}
          />
          <p className="text-sm font-semibold">
            Drop screenshots or rate confirmation images
          </p>
          <p className="mt-2 text-sm text-muted-foreground">or</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 rounded-full border border-primary px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10"
            disabled={disabled || isLoading}
          >
            {isLoading ? "Scanning..." : "Browse files"}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            Upload up to 5 images. JPG, PNG, WEBP. Max 10MB each.
          </p>
        </div>
      ) : onExtract ? (
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm font-semibold">Extraction ready</p>
          <p className="mt-1 text-xs text-muted-foreground">Review the combined offer below before anything is applied to the calculator.</p>
          {conflicts.length > 0 && <p className="mt-2 text-xs text-amber-700">{conflicts.length} conflicting field{conflicts.length === 1 ? '' : 's'} need review.</p>}
          <button type="button" onClick={handleCancel} className="mt-3 rounded-lg border border-border px-3 py-2 text-xs font-medium">Clear extraction</button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Extracted fields {imageCount > 1 ? `from ${imageCount} images` : ""}</p>
            {extractedData.confidence !== undefined && (
              <span
                className={`text-xs ${
                  extractedData.confidence >= 0.7
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {Math.round(extractedData.confidence * 100)}% confidence
              </span>
            )}
          </div>

          {conflicts.length > 0 && (
            <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-xs font-semibold text-amber-700">Needs your review</p>
              {conflicts.map((conflict) => (
                <p key={String(conflict.field)} className="mt-1 text-xs text-muted-foreground">
                  {String(conflict.field)}: {conflict.values.map((item) => `${item.value} (Image ${item.image})`).join(" vs ")}
                </p>
              ))}
            </div>
          )}
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
            {extractedData.deadheadMiles && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadhead:</span>
                <span className="font-medium">{extractedData.deadheadMiles}</span>
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
                <span className="font-medium">
                  {extractedData.loadReference}
                </span>
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
