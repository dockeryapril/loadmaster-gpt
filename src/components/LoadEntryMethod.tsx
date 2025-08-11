import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, Calculator, ArrowRight, Loader2 } from 'lucide-react';
import { OCRUpload } from './OCRUpload';
import { CameraInterface } from './CameraInterface';
import { FieldDetectionResult } from '@/utils/SmartFieldDetector';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { useToast } from '@/hooks/use-toast';
import { OCRPreprocessor } from '@/utils/OCRPreprocessor';
import { SmartFieldDetector } from '@/utils/SmartFieldDetector';
import { OCRCorrectionInterface } from '@/components/OCRCorrectionInterface';

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
  const [currentDetectionResult, setCurrentDetectionResult] = useState<FieldDetectionResult | null>(null);
  const [correctedFields, setCorrectedFields] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { settings } = useSupabaseSettings();
  const { toast } = useToast();

  const handleOCR = async (file: File) => {
    setIsProcessing(true);
    
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
                    console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
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
                description: `Retrying... (${attempt + 1}/${maxAttempts})`,
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

        const detectionResult = await SmartFieldDetector.detectFields(text, settings.enableFuelCostTracking);
        
        // Apply learned corrections
        detectionResult.detectedFields = SmartFieldDetector.applyLearnedCorrections(
          detectionResult.detectedFields
        );

        // Auto-fill high confidence fields immediately
        const autoFillFields = detectionResult.detectedFields.filter(f => f.confidence === 'high');
        
        // Show correction interface if there are uncertain fields
        const uncertainFields = detectionResult.detectedFields.filter(f => 
          f.confidence === 'medium' || f.confidence === 'low'
        );
        
        if (uncertainFields.length > 0) {
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
        description: "Failed to extract text after multiple attempts. Please retake the photo or enter details manually.",
        variant: "destructive",
      });
      setShowOCRFallback(true);
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
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = async () => {
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
      console.error('Camera access failed:', error);
      toast({
        title: "Camera access failed",
        description: "Falling back to file picker",
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
      />
    );
  }

  const handleTextExtracted = (text: string) => {
    console.log('Text extracted:', text);
  };

  const handleFieldsDetected = (result: FieldDetectionResult) => {
    onFieldsDetected(result);
  };

  // Show correction interface
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

  // Show OCR fallback if needed
  if (showOCRFallback) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Extract Text from Image</h2>
          <p className="text-sm text-muted-foreground">
            Take a photo or upload an image of your load document
          </p>
        </div>
        
        <OCRUpload
          onTextExtracted={handleTextExtracted}
          onFieldsDetected={handleFieldsDetected}
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
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Processing Image</h2>
          <p className="text-sm text-muted-foreground">
            Extracting text and analyzing load information...
          </p>
        </div>
        
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Add New Load</h2>
        <p className="text-sm text-muted-foreground">
          Choose how you'd like to enter your load information
        </p>
      </div>

      {/* OCR Options */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-3">Scan Load Document</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Recommended: Automatically extract information from images
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
                  <div className="p-3 rounded-full bg-primary/20">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Upload Image</div>
                    <div className="text-sm text-muted-foreground">
                      Select photos from your device
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
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
                  <div className="p-3 rounded-full bg-primary/20">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Take Photo</div>
                    <div className="text-sm text-muted-foreground">
                      Use your camera to capture load documents
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
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
              <div className="p-3 rounded-full bg-muted">
                <Calculator className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="font-medium">Manual Entry</div>
                <div className="text-sm text-muted-foreground">
                  Enter load details manually
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
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