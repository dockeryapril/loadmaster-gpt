import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { useToast } from '@/hooks/use-toast';
import { OCRPreprocessor } from '@/utils/OCRPreprocessor';
import { SmartFieldDetector, FieldDetectionResult } from '@/utils/SmartFieldDetector';
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
import { useUsageLimits } from '@/hooks/useUsageLimits';

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

export interface OCRProcessorState {
  isProcessing: boolean;
  showCorrection: boolean;
  currentDetectionResult: FieldDetectionResult | null;
  ocrProgress: number;
  processingStage: string;
  isCancelling: boolean;
  showMilesModal: boolean;
}

export function useOCRProcessor(isPro = false) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [currentDetectionResult, setCurrentDetectionResult] = useState<FieldDetectionResult | null>(null);
  const [correctedFields, setCorrectedFields] = useState<Record<string, string>>({});
  const [ocrProgress, setOcrProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showMilesModal, setShowMilesModal] = useState(false);
  const [milesResolver, setMilesResolver] = useState<((value: string | null) => void) | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const { settings } = useSupabaseSettings();
  const { toast } = useToast();
  const { handleRateLimitError } = useRateLimit();
  const { canUse, limit, incrementUsage } = useUsageLimits();

  const processOCR = async (file: File, onSuccess: (result: FieldDetectionResult) => void, onFallback: () => void) => {
    // Pre-flight check for usage limits
    if (!canUse) {
      toast({
        title: "Limit reached",
        description: `You've used all ${limit} scans this month`,
        variant: "destructive",
      });
      onFallback();
      return;
    }
    
    console.log('🔄 OCR: Starting OCR process for file:', file.name);
    setIsProcessing(true);
    setIsCancelling(false);
    setOcrProgress(0);
    setProcessingStage('Initializing...');
    
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;
    
    // Set up timeout to prevent indefinite spinning
    const timeoutMs = 120000; // 2 minutes timeout
    const timeoutId = setTimeout(() => {
      console.log('⏰ OCR: Processing timeout reached, aborting');
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      toast({
        title: "Processing timeout",
        description: "OCR processing took too long. Please try again with a clearer image.",
        variant: "destructive",
      });
    }, timeoutMs);
    
    const startTime = logOCRStart('useOCRProcessor');
    let usageIncremented = false;
    try {
      if (abortSignal.aborted) {
        throw new Error('Upload cancelled');
      }

      setProcessingStage('Optimizing image...');
      toast({
        title: "Processing image...",
        description: "Optimizing image and extracting text.",
      });

      const preprocessResult = await OCRPreprocessor.preprocessImage(file);

      if (abortSignal.aborted) {
        OCRPreprocessor.cleanup(preprocessResult.processedImageUrl);
        throw new Error('Upload cancelled');
      }

      let text = '';
      const maxAttempts = 3;
      setProcessingStage('Extracting text...');
      
      try {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            if (abortSignal.aborted) {
              throw new Error('Upload cancelled');
            }

            const result = await Tesseract.recognize(
              preprocessResult.processedImageUrl,
              'eng',
              {
                logger: m => {
                  if (abortSignal.aborted) {
                    throw new Error('Upload cancelled');
                  }
                  if (m.status === 'recognizing text') {
                    const progress = m.progress * 100;
                    setOcrProgress(progress);
                  }
                }
              }
            );
            
            if (abortSignal.aborted) {
              throw new Error('Upload cancelled');
            }
            
            text = result.data.text;
            break;
          } catch (err) {
            if (abortSignal.aborted) {
              throw new Error('Upload cancelled');
            }
            
            if (attempt < maxAttempts) {
              toast({
                title: `Imaging attempt ${attempt} failed`,
                description: `Trying again (${attempt + 1}/${maxAttempts})`,
                variant: "destructive",
              });
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            } else {
              throw err;
            }
          }
        }
      } finally {
        OCRPreprocessor.cleanup(preprocessResult.processedImageUrl);
      }

      if (text.trim()) {
        if (abortSignal.aborted) {
          throw new Error('Upload cancelled');
        }

        setProcessingStage('Analyzing with AI...');
        toast({
          title: "Analyzing text...",
          description: "Using AI to detect load information.",
        });

        let detectionResult: FieldDetectionResult | null = null;
        try {
          // Increment usage only when we're about to make the API call
          if (!usageIncremented) {
            await incrementUsage();
            usageIncremented = true;
          }
          
          detectionResult = await SmartFieldDetector.detectFields(
            text,
            settings.enableFuelCostTracking,
            abortSignal
          );
          
          if (abortSignal.aborted) {
            throw new Error('Upload cancelled');
          }
        } catch (err) {
          if (abortSignal.aborted || (err instanceof Error && err.message === 'Upload cancelled')) {
            throw new Error('Upload cancelled');
          }
          
          if (err instanceof RateLimitExceededError) {
            // Note: No rollback needed for unified system as it's managed in database
            handleRateLimitError(err);
            return;
          }
          recordError(err, { source: 'useOCRProcessor', stage: 'field_detection' }).catch(() => {});
        }

        if (!detectionResult || detectionResult.detectedFields.length === 0) {
          toast({
            title: 'Field detection failed',
            description: 'Could not detect load information. Switching to manual entry.',
            variant: 'destructive',
          });
          logOCREnd('useOCRProcessor', startTime, false, 'field_detection_failed');
          onFallback();
          return;
        }

        detectionResult.detectedFields = SmartFieldDetector.applyLearnedCorrections(
          detectionResult.detectedFields
        );

        // Check for cancellation before handling miles
        if (abortSignal.aborted) {
          throw new Error('Upload cancelled');
        }

        const handleMilesPrompt = () => {
          return new Promise<string | null>((resolve) => {
            // Check for cancellation before showing modal
            if (abortSignal.aborted) {
              resolve(null);
              return;
            }
            setMilesResolver(() => resolve);
            setShowMilesModal(true);
          });
        };

        const ensuredFieldsResult = ensureMiles(detectionResult.detectedFields, handleMilesPrompt);
        
        const processEnsuredFields = async () => {
          // Check for cancellation before processing ensured fields
          if (abortSignal.aborted) {
            throw new Error('Upload cancelled');
          }
          
          const ensuredFields = await Promise.resolve(ensuredFieldsResult);
          
          // Check for cancellation after resolving
          if (abortSignal.aborted) {
            throw new Error('Upload cancelled');
          }
          
          if (!ensuredFields) {
            toast({
              title: 'Miles required',
              description: 'Miles are required to proceed.',
              variant: 'destructive',
            });
            logOCREnd('useOCRProcessor', startTime, false, 'missing_miles');
            return;
          }
          
          detectionResult.detectedFields = ensuredFields;
        };

        await processEnsuredFields();

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
                  }
                  return acc;
                },
                {} as Record<string, number>
              );
              const fused = fuse(normalized.data, numericFields) as any;
              fused.warnings = findWarnings(fused as any);
              if (extractionConfidence < 0.8)
                fused.warnings.push('Low confidence extraction');
              
              if (fused.warnings.length > 0) {
                detectionResult.warnings = fused.warnings;
              }
            }
          }
        } catch (err) {
          if (err instanceof RateLimitExceededError) {
            handleRateLimitError(err);
            return;
          }
          recordError(err, { source: 'useOCRProcessor', stage: 'llm_extraction' }).catch(() => {});
        }

        const uncertainFields = detectionResult.detectedFields.filter(
          f => f.confidence === 'medium' || f.confidence === 'low'
        );

        if (uncertainFields.length > 0 || extractionConfidence < 0.8) {
          setCurrentDetectionResult(detectionResult);
          setShowCorrection(true);
        } else {
          onSuccess(detectionResult);
        }

        toast({
          title: "Text extracted successfully!",
          description: `Found ${detectionResult.detectedFields.length} load fields.`,
        });
        logOCREnd('useOCRProcessor', startTime, true);

      } else {
        toast({
          title: "No text detected",
          description: "Check lighting and retake the photo or upload a clearer image.",
          variant: "destructive",
        });
        logOCREnd('useOCRProcessor', startTime, false, 'no_text');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Upload cancelled') {
        // Note: No rollback needed for unified system as it's managed in database
        logOCREnd('useOCRProcessor', startTime, false, 'cancelled');
        return;
      }
      
      if (error instanceof RateLimitExceededError) {
        // Note: No rollback needed for unified system as it's managed in database
        handleRateLimitError(error);
        return;
      } else {
        recordError(error, { source: 'useOCRProcessor' }).catch(() => {});
        toast({
          title: "Imaging failed",
          description: "Could not extract text. Try again or enter details manually.",
          variant: "destructive",
        });
        onFallback();
        logOCREnd('useOCRProcessor', startTime, false, error);
      }
    } finally {
      // Always reset processing state to prevent stuck spinning
      console.log('🔄 OCR: Finally block - resetting processing state');
      clearTimeout(timeoutId);
      resetProcessingState();
    }
  };

  const resetProcessingState = () => {
    console.log('🔄 OCR: Resetting processing state');
    setIsProcessing(false);
    setOcrProgress(0);
    setProcessingStage('');
    setIsCancelling(false);
    setShowMilesModal(false); // Close miles modal on reset
    if (milesResolver) {
      milesResolver(null); // Resolve with null to cancel miles input
      setMilesResolver(null);
    }
    abortControllerRef.current = null;
  };

  const cancelUpload = () => {
    if (isCancelling) return;
    
    setIsCancelling(true);
    setProcessingStage('Cancelling...');
    
    setTimeout(() => {
      resetProcessingState();
    }, 100);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    toast({
      title: "Upload cancelled",
      description: "Image processing stopped.",
    });
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

  const confirmCorrections = (onSuccess: (result: FieldDetectionResult) => void) => {
    if (currentDetectionResult) {
      Object.entries(correctedFields).forEach(([field, correctedValue]) => {
        const originalField = currentDetectionResult.detectedFields.find(f => f.field === field);
        if (originalField && originalField.value !== correctedValue) {
          SmartFieldDetector.saveUserCorrection(originalField.value, correctedValue, field);
        }
      });

      onSuccess(currentDetectionResult);
    }
    
    setShowCorrection(false);
    setCurrentDetectionResult(null);
    setCorrectedFields({});
  };

  const cancelCorrections = () => {
    setShowCorrection(false);
    setCurrentDetectionResult(null);
    setCorrectedFields({});
  };

  const confirmMiles = (miles: string) => {
    setShowMilesModal(false);
    milesResolver?.(miles);
    setMilesResolver(null);
  };

  const cancelMiles = () => {
    setShowMilesModal(false);
    milesResolver?.(null);
    setMilesResolver(null);
  };

  return {
    // State
    isProcessing,
    showCorrection,
    currentDetectionResult,
    ocrProgress,
    processingStage,
    isCancelling,
    showMilesModal,
    
    // Actions
    processOCR,
    cancelUpload,
    handleFieldCorrection,
    confirmCorrections,
    cancelCorrections,
    confirmMiles,
    cancelMiles,
    resetProcessingState,
  };
}