import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { OCRPreprocessor } from '@/utils/OCRPreprocessor';
import { SmartFieldDetector, FieldDetectionResult } from '@/utils/SmartFieldDetector';
import { OCRCorrectionInterface } from '@/components/OCRCorrectionInterface';
import { logOCRStart, logOCREnd } from '@/utils/metrics';
import { ensureMiles } from '@/utils/ensureMiles';
import { recordExtractionEvent, recordError } from '@/ai/telemetry';
import { fuse } from '@/ai/fuse';
import { findWarnings } from '@/lib/normalize';
import { extractionSchema } from '@/ai/extractionSchema';

interface OCRUploadProps {
  onTextExtracted: (text: string) => void;
  onFieldsDetected?: (result: FieldDetectionResult) => void;
  /**
   * Invoked when field detection fails and manual entry is required.
   */
  onManualEntry: () => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  enableFuelCostTracking?: boolean;
}

export function OCRUpload({ onTextExtracted, onFieldsDetected, onManualEntry, isProcessing, setIsProcessing, enableFuelCostTracking = false }: OCRUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [showCorrection, setShowCorrection] = useState(false);
  const [currentDetectionResult, setCurrentDetectionResult] = useState<FieldDetectionResult | null>(null);
  const [correctedFields, setCorrectedFields] = useState<Record<string, string>>({});
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const fullImagePromiseRef = useRef<Promise<string> | null>(null);
  const fullImageUrlRef = useRef<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  const handleOCR = async (file: File) => {
    setIsProcessing(true);
    setOcrProgress(0);
    const startTime = logOCRStart('OCRUpload');
    try {
      toast({
        title: "Processing image...",
        description: "Optimizing image and extracting text.",
      });

      // Step 1: Preprocess image for better OCR
      const preprocessResult = await OCRPreprocessor.preprocessImage(file);

      // Step 2: Extract text with Tesseract and retry logic
      let text = '';
      const maxAttempts = 3;
      try {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const recognizePromise = Tesseract.recognize(
              preprocessResult.processedImageUrl,
              'eng',
              {
                logger: m => {
                  if (m.status === 'recognizing text') {
                    const progress = m.progress * 100;
                    setOcrProgress(progress);
                    console.log(`OCR Progress: ${Math.round(progress)}%`);
                  }
                }
              }
            );

            fullImagePromiseRef.current?.then(url => setPreviewSrc(url));

            const result = await recognizePromise;
            text = result.data.text;
            break;
          } catch (err) {
            if (attempt < maxAttempts) {
              toast({
                title: `OCR attempt ${attempt} failed`,
                description: `Trying again (${attempt + 1}/${maxAttempts}). Ensure the image is clear.`,
                variant: "destructive",
              });
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            } else {
              throw err;
            }
          }
        }
      } finally {
        // Cleanup processed image
        OCRPreprocessor.cleanup(preprocessResult.processedImageUrl);
      }

      if (text.trim()) {
        // Step 3: AI-powered field detection
        toast({
          title: "Analyzing text...",
          description: "Using AI to detect load information.",
        });

        let detectionResult: FieldDetectionResult | null = null;
        try {
          detectionResult = await SmartFieldDetector.detectFields(
            text,
            enableFuelCostTracking
          );
        } catch (err) {
          recordError(err, { source: 'OCRUpload', stage: 'field_detection' }).catch(() => {});
        }

        if (!detectionResult || detectionResult.detectedFields.length === 0) {
          setShowCorrection(false);
          setCurrentDetectionResult(null);
          setCorrectedFields({});
          toast({
            title: 'Field detection failed',
            description:
              'Could not detect load information. Switching to manual entry.',
            variant: 'destructive',
          });
          logOCREnd('OCRUpload', startTime, false, 'field_detection_failed');
          recordExtractionEvent({
            source: 'OCRUpload',
            success: false,
            duration: Date.now() - startTime,
            error: 'field_detection_failed'
          }).catch(() => {});
          onManualEntry();
          return;
        }

        // Apply learned corrections
        detectionResult.detectedFields = SmartFieldDetector.applyLearnedCorrections(
          detectionResult.detectedFields
        );

        // Ensure miles field is present
        const ensuredFields = ensureMiles(detectionResult.detectedFields);
        if (!ensuredFields) {
          toast({
            title: 'Miles required',
            description: 'Miles are required to proceed.',
            variant: 'destructive',
          });
          logOCREnd('OCRUpload', startTime, false, 'missing_miles');
          recordExtractionEvent({
            source: 'OCRUpload',
            success: false,
            duration: Date.now() - startTime,
            error: 'missing_miles'
          }).catch(() => {});
          return;
        }
        detectionResult.detectedFields = ensuredFields;

        // Fuse fields and check for warnings
        const numericFields = detectionResult.detectedFields.reduce(
          (acc, field) => {
            const parsed = parseFloat(field.value.replace(/[^0-9.]/g, ''));
            if (Number.isNaN(parsed)) return acc;
            switch (field.field) {
              case 'weight':
                acc.weightLbs = parsed;
                break;
              case 'miles':
                acc.distanceMi = parsed;
                break;
              case 'rate':
                acc.offerFlat = parsed;
                break;
              default:
                break;
            }
            return acc;
          },
          {} as Record<string, number>
        );
        const fused = fuse({}, numericFields) as any;
        fused.warnings = findWarnings(fused as any);
        extractionSchema.safeParse({
          fields: fused,
          confidence:
            { high: 0.9, medium: 0.6, low: 0.3 }[
              detectionResult.confidence
            ] ?? 0,
        });
        if (fused.warnings.length > 0) {
          fused.warnings.forEach(warning =>
            toast({
              title: 'Warning',
              description: warning,
            })
          );
          detectionResult.warnings = fused.warnings;
        }

        // Auto-fill high confidence fields immediately
        const autoFillFields = detectionResult.detectedFields.filter(
          f => f.confidence === 'high'
        );
        if (autoFillFields.length > 0 && onFieldsDetected) {
          onFieldsDetected(detectionResult);
        }

        // Show correction interface if there are uncertain fields
        const uncertainFields = detectionResult.detectedFields.filter(
          f => f.confidence === 'medium' || f.confidence === 'low'
        );

        if (uncertainFields.length > 0) {
          setCurrentDetectionResult(detectionResult);
          setShowCorrection(true);
        }

        onTextExtracted(text);
        toast({
          title: "Text extracted successfully!",
          description: `Found ${detectionResult.detectedFields.length} load fields. ${autoFillFields.length} auto-filled.`,
        });
        logOCREnd('OCRUpload', startTime, true);
        recordExtractionEvent({
          source: 'OCRUpload',
          success: true,
          duration: Date.now() - startTime
        }).catch(() => {});
      } else {
        toast({
          title: "No text detected",
          description: "Check lighting and retake the photo or upload a clearer image.",
          variant: "destructive",
        });
        logOCREnd('OCRUpload', startTime, false, 'no_text');
        recordExtractionEvent({
          source: 'OCRUpload',
          success: false,
          duration: Date.now() - startTime,
          error: 'no_text'
        }).catch(() => {});
      }
    } catch (error) {
      recordError(error, { source: 'OCRUpload' }).catch(() => {});
      toast({
        title: "OCR failed",
        description: "Could not extract text after several tries. Retake the photo in good lighting or enter details manually.",
        variant: "destructive",
      });
      logOCREnd('OCRUpload', startTime, false, error);
      recordExtractionEvent({
        source: 'OCRUpload',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      }).catch(() => {});
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
      if (fullImageUrlRef.current) {
        URL.revokeObjectURL(fullImageUrlRef.current);
        fullImageUrlRef.current = null;
      }
      fullImagePromiseRef.current = null;
      if (imageElementRef.current) {
        imageElementRef.current.src = '';
        imageElementRef.current = null;
      }
      if (previewCanvasRef.current) {
        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        previewCanvasRef.current = null;
      }
      setPreviewSrc(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (fullImageUrlRef.current) {
        URL.revokeObjectURL(fullImageUrlRef.current);
        fullImageUrlRef.current = null;
      }
      if (previewCanvasRef.current) {
        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        previewCanvasRef.current = null;
      }
      if (imageElementRef.current) {
        imageElementRef.current.src = '';
        imageElementRef.current = null;
      }

      createImageBitmap(file, { resizeWidth: 200, resizeHeight: 200 })
        .then(bitmap => {
          const canvas = document.createElement('canvas');
          previewCanvasRef.current = canvas;
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(bitmap, 0, 0);
          setPreviewSrc(canvas.toDataURL());
          bitmap.close();
        })
        .catch(err => logError('Preview generation error:', err));

      fullImagePromiseRef.current = new Promise(resolve => {
        const url = URL.createObjectURL(file);
        fullImageUrlRef.current = url;
        const img = new Image();
        imageElementRef.current = img;
        img.onload = () => resolve(url);
        img.src = url;
      });

      handleOCR(file);
    } else {
      toast({
        title: "Unsupported file",
        description: "Choose a JPEG or PNG photo and try again.",
        variant: "destructive",
      });
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFieldCorrection = (field: string, value: string) => {
    setCorrectedFields(prev => ({ ...prev, [field]: value }));
    
    if (currentDetectionResult) {
      const updatedFields = currentDetectionResult.detectedFields.map(f => 
        f.field === field ? { ...f, value } : f
      );
      setCurrentDetectionResult({
        ...currentDetectionResult,
        detectedFields: updatedFields
      });
    }
  };

  const handleConfirmCorrections = () => {
    if (currentDetectionResult && onFieldsDetected) {
      // Save user corrections for learning
      Object.entries(correctedFields).forEach(([field, correctedValue]) => {
        const originalField = currentDetectionResult.detectedFields.find(f => f.field === field);
        if (originalField && originalField.value !== correctedValue) {
          SmartFieldDetector.saveUserCorrection(originalField.value, correctedValue, field);
        }
      });

      onFieldsDetected(currentDetectionResult);
    }
    
    setShowCorrection(false);
    setCurrentDetectionResult(null);
    setCorrectedFields({});
  };

  const handleCancelCorrections = () => {
    setShowCorrection(false);
    setCurrentDetectionResult(null);
    setCorrectedFields({});
  };

  if (showCorrection && currentDetectionResult) {
    return (
      <OCRCorrectionInterface
        detectedFields={currentDetectionResult.detectedFields}
        rawText={currentDetectionResult.rawText}
        onFieldCorrection={handleFieldCorrection}
        onConfirm={handleConfirmCorrections}
        onCancel={handleCancelCorrections}
        overallConfidence={currentDetectionResult.confidence}
        warnings={currentDetectionResult.warnings}
      />
    );
  }

  return (
    <section aria-labelledby="ocr-upload-heading">
      <Card className="p-6 border-2 border-dashed border-border hover:border-muted-foreground transition-colors">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h2 id="ocr-upload-heading" className="text-lg font-semibold">Extract Text from Image</h2>
            <p className="text-sm text-muted-foreground">
              Take a photo or upload an image of your load details - AI will auto-fill the form
            </p>
          </div>

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 py-8">
            {previewSrc && (
              <img
                src={previewSrc}
                alt="Selected image preview"
                className="max-h-48 object-contain rounded"
              />
            )}
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <Progress value={ocrProgress} className="w-48" />
            <p className="text-sm text-muted-foreground">{Math.round(ocrProgress)}%</p>
            <div className="text-sm text-muted-foreground space-y-1 text-center">
              <p>Processing image...</p>
              <p className="text-xs">Optimizing → OCR → AI Analysis</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleCameraCapture}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Take Photo
            </Button>
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Image
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>✓ AI auto-fills: Miles, Rate, Origin, Destination, Deadhead</p>
          <p>✓ Red highlights = needs review</p>
          <p>For best results, ensure text is clear and well-lit</p>
        </div>
        </div>
      </Card>
    </section>
  );
}