import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Upload, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { OCRPreprocessor } from '@/utils/OCRPreprocessor';
import { SmartFieldDetector, FieldDetectionResult } from '@/utils/SmartFieldDetector';
import { OCRCorrectionInterface } from '@/components/OCRCorrectionInterface';

interface OCRUploadProps {
  onTextExtracted: (text: string) => void;
  onFieldsDetected?: (result: FieldDetectionResult) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  enableFuelCostTracking?: boolean;
}

export function OCRUpload({ onTextExtracted, onFieldsDetected, isProcessing, setIsProcessing, enableFuelCostTracking = false }: OCRUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [showCorrection, setShowCorrection] = useState(false);
  const [currentDetectionResult, setCurrentDetectionResult] = useState<FieldDetectionResult | null>(null);
  const [correctedFields, setCorrectedFields] = useState<Record<string, string>>({});

  const handleOCR = async (file: File) => {
    setIsProcessing(true);
    
    try {
      toast({
        title: "Processing image...",
        description: "Optimizing image and extracting text.",
      });

      // Step 1: Preprocess image for better OCR
      const preprocessResult = await OCRPreprocessor.preprocessImage(file);
      
      // Step 2: Extract text with Tesseract
      const { data: { text } } = await Tesseract.recognize(
        preprocessResult.processedImageUrl,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      // Cleanup processed image
      OCRPreprocessor.cleanup(preprocessResult.processedImageUrl);

      if (text.trim()) {
        // Step 3: AI-powered field detection
        toast({
          title: "Analyzing text...",
          description: "Using AI to detect load information.",
        });

        const detectionResult = await SmartFieldDetector.detectFields(text, enableFuelCostTracking);
        
        // Apply learned corrections
        detectionResult.detectedFields = SmartFieldDetector.applyLearnedCorrections(
          detectionResult.detectedFields
        );

        // Auto-fill high confidence fields immediately
        const autoFillFields = detectionResult.detectedFields.filter(f => f.confidence === 'high');
        if (autoFillFields.length > 0 && onFieldsDetected) {
          onFieldsDetected(detectionResult);
        }

        // Show correction interface if there are uncertain fields
        const uncertainFields = detectionResult.detectedFields.filter(f => 
          f.confidence === 'medium' || f.confidence === 'low'
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
      } else {
        toast({
          title: "No text found",
          description: "Could not extract any text from the image. Please try a clearer image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: "OCR failed",
        description: "Failed to extract text from the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleOCR(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
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
      />
    );
  }

  return (
    <Card className="p-6 border-2 border-dashed border-border hover:border-muted-foreground transition-colors">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Extract Text from Image</h3>
          <p className="text-sm text-muted-foreground">
            Take a photo or upload an image of your load details - AI will auto-fill the form
          </p>
        </div>

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground space-y-1">
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
  );
}