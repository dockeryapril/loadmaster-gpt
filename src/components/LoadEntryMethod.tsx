import React, { useRef, useState } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, Calculator, ArrowRight, Loader2 } from 'lucide-react';
import { OCRUpload } from './OCRUpload';
import { CameraInterface } from './CameraInterface';
import { FieldDetectionResult } from '@/utils/SmartFieldDetector';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { useToast } from '@/hooks/use-toast';
import { OCRPreprocessor } from '@/utils/OCRPreprocessor';
import { SmartFieldDetector } from '@/utils/SmartFieldDetector';
import { OCRCorrectionInterface } from '@/components/OCRCorrectionInterface';
import { logOCRStart, logOCREnd } from '@/utils/metrics';
import { ensureMiles } from '@/utils/ensureMiles';
import { recordExtractionEvent, recordError } from '@/ai/telemetry';
import { extractVision } from '@/ai/extractVision';
import { extractText as extractLLMText } from '@/ai/extractText';
import { fuse } from '@/ai/fuse';
import { findWarnings, validateAndNormalize } from '@/lib/normalize';
import { extractionSchema } from '@/ai/extractionSchema';
import { useRateLimit } from '@/contexts/RateLimitContext';
import { RateLimitExceededError } from '@/utils/apiWrapper';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

interface LoadEntryMethodProps {
  onFieldsDetected: (result: FieldDetectionResult) => void;
  onManualEntry: () => void;
  onClose?: () => void;
}

export function LoadEntryMethod({ onFieldsDetected, onManualEntry, onClose }: LoadEntryMethodProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOCRFallback, setShowOCRFallback] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [showCameraInterface, setShowCameraInterface] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraTriggerElement, setCameraTriggerElement] = useState<HTMLElement | null>(null);
  const [currentDetectionResult, setCurrentDetectionResult] = useState<FieldDetectionResult | null>(null);
  const [correctedFields, setCorrectedFields] = useState<Record<string, string>>({});
  const [ocrProgress, setOcrProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { settings } = useSupabaseSettings();
  const { toast } = useToast();
  const { handleRateLimitError } = useRateLimit();

  const handleOCR = async (file: File) => {
    setIsProcessing(true);
    setOcrProgress(0);
    const startTime = logOCRStart('LoadEntryMethod');
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
            const result = await Tesseract.recognize(
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
            settings.enableFuelCostTracking
          );
        } catch (err) {
          if (err instanceof RateLimitExceededError) {
            handleRateLimitError(err);
            return;
          }
          recordError(err, { source: 'LoadEntryMethod', stage: 'field_detection' }).catch(() => {});
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
          logOCREnd('LoadEntryMethod', startTime, false, 'field_detection_failed');
          recordExtractionEvent({
            source: 'LoadEntryMethod',
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
          logOCREnd('LoadEntryMethod', startTime, false, 'missing_miles');
          recordExtractionEvent({
            source: 'LoadEntryMethod',
            success: false,
            duration: Date.now() - startTime,
            error: 'missing_miles'
          }).catch(() => {});
          return;
        }
        detectionResult.detectedFields = ensuredFields;

        let extractionConfidence = 1;
        try {
          const base64 = await fileToBase64(file);
          let rawExtraction: string | null = null;
          try {
            rawExtraction = await extractVision(base64, text);
          } catch (visionErr) {
            if (visionErr instanceof RateLimitExceededError) {
              handleRateLimitError(visionErr);
              return;
            }
            rawExtraction = await extractLLMText(text);
          }
          if (rawExtraction) {
            const { fields, confidence } = JSON.parse(rawExtraction);
            extractionConfidence = confidence ?? extractionConfidence;
            const normalized = validateAndNormalize(fields);
            if (normalized.data) {
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
            const fused = fuse(normalized.data, numericFields) as any;
            fused.warnings = findWarnings(fused as any);
            if (extractionConfidence < 0.8)
              fused.warnings.push('Low confidence extraction');
            const validated = validateAndNormalize(fused);
            if (validated.issues) {
              validated.issues.forEach(issue => {
                fused.warnings.push(issue.message);
                recordError(issue.message, {
                  source: 'LoadEntryMethod',
                  stage: 'validation'
                }).catch(() => {});
              });
            }
            extractionSchema.safeParse({
              fields: fused,
              confidence: extractionConfidence,
            });
            if (fused.warnings.length > 0) {
              fused.warnings.forEach(warning =>
                toast({ title: 'Warning', description: warning })
              );
              detectionResult.warnings = fused.warnings;
            }
          }
        }
        } catch (err) {
          if (err instanceof RateLimitExceededError) {
            handleRateLimitError(err);
            return;
          }
          recordError(err, { source: 'LoadEntryMethod', stage: 'llm_extraction' }).catch(() => {});
        }

        // Auto-fill high confidence fields immediately
        const autoFillFields = detectionResult.detectedFields.filter(
          f => f.confidence === 'high'
        );

        // Show correction interface if there are uncertain fields or low LLM confidence
        const uncertainFields = detectionResult.detectedFields.filter(
          f => f.confidence === 'medium' || f.confidence === 'low'
        );

        if (uncertainFields.length > 0 || extractionConfidence < 0.8) {
          setCurrentDetectionResult(detectionResult);
          setShowCorrection(true);
        } else {
          // All fields are high confidence, proceed directly
          onFieldsDetected(detectionResult);
        }

        toast({
          title: "Text extracted successfully!",
          description: `Found ${detectionResult.detectedFields.length} load fields. ${autoFillFields.length} auto-filled.`,
        });
        logOCREnd('LoadEntryMethod', startTime, true);
        recordExtractionEvent({
          source: 'LoadEntryMethod',
          success: true,
          duration: Date.now() - startTime
        }).catch(() => {});
      } else {
        toast({
          title: "No text detected",
          description: "Check lighting and retake the photo or upload a clearer image.",
          variant: "destructive",
        });
        logOCREnd('LoadEntryMethod', startTime, false, 'no_text');
        recordExtractionEvent({
          source: 'LoadEntryMethod',
          success: false,
          duration: Date.now() - startTime,
          error: 'no_text'
        }).catch(() => {});
      }
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        handleRateLimitError(error);
        return;
      } else {
        recordError(error, { source: 'LoadEntryMethod' }).catch(() => {});
        toast({
          title: "OCR failed",
          description: "Could not extract text after several tries. Retake the photo in good lighting or enter details manually.",
          variant: "destructive",
        });
        setShowOCRFallback(true);
        logOCREnd('LoadEntryMethod', startTime, false, error);
        recordExtractionEvent({
          source: 'LoadEntryMethod',
          success: false,
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error)
        }).catch(() => {});
      }
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (imageElementRef.current) {
        imageElementRef.current.src = '';
        imageElementRef.current = null;
      }
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        canvasRef.current = null;
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (imageElementRef.current) {
        imageElementRef.current.src = '';
        imageElementRef.current = null;
      }
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        canvasRef.current = null;
      }
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      imageElementRef.current = new Image();
      imageElementRef.current.src = url;
      canvasRef.current = document.createElement('canvas');
      handleOCR(file);
    } else {
      toast({
        title: "Unsupported file",
        description: "Choose a JPEG or PNG photo and try again.",
        variant: "destructive",
      });
    }
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Remember the element that opened the camera so focus can return
    setCameraTriggerElement(e.currentTarget);
    try {
      // Try to use getUserMedia for direct camera access
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        // Create a camera interface
        setShowCameraInterface(true);
        setCameraStream(stream);
      } else {
        // Fallback to file input with capture
        cameraInputRef.current?.click();
      }
    } catch (error) {
      recordError(error, { source: 'LoadEntryMethod', stage: 'camera_access' }).catch(() => {});
      toast({
        title: "Camera access failed",
        description: "Check browser permissions and try again, or upload a photo instead.",
        variant: "destructive",
      });
      // Fallback to file input
      cameraInputRef.current?.click();
    }
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
    if (currentDetectionResult) {
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

  const handleCloseCameraInterface = () => {
    setShowCameraInterface(false);
    setCameraStream(null);
  };

  // Show camera interface
  if (showCameraInterface && cameraStream) {
    return (
      <CameraInterface
        stream={cameraStream}
        onCapture={handleOCR}
        onClose={handleCloseCameraInterface}
        triggerElement={cameraTriggerElement}
      />
    );
  }

  useFocusTrap(dialogRef, onClose);

  const handleTextExtracted = (text: string) => {
    console.log('Text extracted:', text);
  };

  const handleFieldsDetected = (result: FieldDetectionResult) => {
    onFieldsDetected(result);
  };

  // Show correction interface
  if (showCorrection && currentDetectionResult) {
    console.log('Rendering OCRCorrectionInterface with:', {
      detectedFields: currentDetectionResult.detectedFields,
      rawTextLength: currentDetectionResult.rawText?.length,
      confidence: currentDetectionResult.confidence
    });
    
    return (
      <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} className="min-h-screen p-4">
        <OCRCorrectionInterface
          detectedFields={currentDetectionResult.detectedFields}
          rawText={currentDetectionResult.rawText}
          onFieldCorrection={handleFieldCorrection}
          onConfirm={handleConfirmCorrections}
          onCancel={handleCancelCorrections}
          overallConfidence={currentDetectionResult.confidence}
          warnings={currentDetectionResult.warnings}
        />
      </div>
    );
  }

  // Show OCR fallback if needed
  if (showOCRFallback) {
    return (
      <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Extract Text from Image</h2>
          <p className="text-sm text-muted-foreground">
            Take a photo or upload an image of your load document
          </p>
        </div>
        
        <OCRUpload
          onTextExtracted={handleTextExtracted}
          onFieldsDetected={handleFieldsDetected}
          onManualEntry={onManualEntry}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          enableFuelCostTracking={settings.enableFuelCostTracking}
        />

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowOCRFallback(false)}
            disabled={isProcessing}
            className="w-full max-w-xs"
          >
            Back to Options
          </Button>
        </div>
      </div>
    );
  }

  // Show processing overlay if needed
  if (isProcessing) {
    return (
      <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Processing Image</h2>
          <p className="text-sm text-muted-foreground">
            Extracting text and analyzing load information...
          </p>
        </div>
        
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Progress value={ocrProgress} className="w-48" />
            <p className="text-sm text-muted-foreground">{Math.round(ocrProgress)}%</p>
            <div className="text-center space-y-2">
              <p className="font-medium">Processing your image</p>
              <p className="text-sm text-muted-foreground">
                Optimizing → OCR → AI Analysis
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Add New Load</h2>
        <p className="text-sm text-muted-foreground">
          Choose how you'd like to enter your load information
        </p>
      </div>

      {/* OCR Options */}
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-4">
            We recommend uploading an image or taking a photo to automatically and quickly extract and analyze information about the load
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                className="w-full h-auto p-0 hover:bg-transparent"
                onClick={handleUploadClick}
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="icon-badge bg-primary/20">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Upload Image/Screenshot</div>
                    <div className="text-sm text-muted-foreground">
                      Select photos from your device
                    </div>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                className="w-full h-auto p-0 hover:bg-transparent"
                onClick={handleCameraClick}
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="icon-badge bg-primary/20">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Take Photo</div>
                    <div className="text-sm text-muted-foreground">
                      Use your camera to capture load documents
                    </div>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manual Entry Option */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <Button
            variant="outline"
            className="w-full h-auto p-0 border-2 hover:border-primary/50"
            onClick={onManualEntry}
          >
            <div className="flex items-center justify-center gap-4 p-4">
              <div className="icon-badge bg-muted">
                <Calculator className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="font-medium">Manual Entry</div>
                <div className="text-sm text-muted-foreground">
                  Enter load details manually
                </div>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Hidden file inputs */}
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
    </div>
  );
}