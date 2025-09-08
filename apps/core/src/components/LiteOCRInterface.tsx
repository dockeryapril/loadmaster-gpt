import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, Loader2, X } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface ExtractedData {
  miles?: string;
  offerAllIn?: string;
  weightLbs?: string;
  pickupInHours?: string;
}

interface LiteOCRInterfaceProps {
  onSuccess: (data: ExtractedData) => void;
  onClose: () => void;
}

export function LiteOCRInterface({ onSuccess, onClose }: LiteOCRInterfaceProps) {
  const [processing, setProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access failed:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            handleFileUpload(blob);
          }
        }, 'image/jpeg', 0.8);
      }
    }
    stopCamera();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const extractDataFromText = (text: string): ExtractedData => {
    const extractedData: ExtractedData = {};
    
    // Miles extraction - look for numbers near miles/mi/distance keywords
    const milesPatterns = [
      /(?:miles?|mi\.?|distance)\s*:?\s*(\d+(?:,\d{3})*)/i,
      /(\d+(?:,\d{3})*)\s*(?:miles?|mi\.?)/i,
      /total\s+(?:miles?|distance)\s*:?\s*(\d+(?:,\d{3})*)/i
    ];
    
    for (const pattern of milesPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extractedData.miles = match[1].replace(/,/g, '');
        break;
      }
    }
    
    // Rate extraction - look for dollar amounts near rate/pay/total keywords  
    const ratePatterns = [
      /(?:rate|pay|total|amount)\s*:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/,
      /(?:all\s*in|gross)\s*:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
    ];
    
    for (const pattern of ratePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleanRate = match[1].replace(/,/g, '');
        // Only consider reasonable freight rates (> $100)
        if (parseFloat(cleanRate) > 100) {
          extractedData.offerAllIn = cleanRate;
          break;
        }
      }
    }
    
    // Weight extraction - look for numbers near weight/lbs/pounds keywords
    const weightPatterns = [
      /(?:weight|wt\.?|lbs?|pounds?)\s*:?\s*(\d+(?:,\d{3})*)/i,
      /(\d+(?:,\d{3})*)\s*(?:lbs?|pounds?|#)/i,
      /gross\s+weight\s*:?\s*(\d+(?:,\d{3})*)/i
    ];
    
    for (const pattern of weightPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleanWeight = match[1].replace(/,/g, '');
        // Only consider reasonable freight weights (> 1000 lbs)
        if (parseInt(cleanWeight) > 1000) {
          extractedData.weightLbs = cleanWeight;
          break;
        }
      }
    }
    
    // Pickup time extraction - look for hours/time references
    const pickupPatterns = [
      /(?:pickup|ready)\s+(?:in\s+)?(\d+)\s*(?:hours?|hrs?)/i,
      /(\d+)\s*(?:hours?|hrs?)\s*(?:notice|pickup)/i
    ];
    
    for (const pattern of pickupPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extractedData.pickupInHours = match[1];
        break;
      }
    }
    
    return extractedData;
  };

  const handleFileUpload = async (file: File | Blob) => {
    setProcessing(true);
    setOcrProgress(0);
    setProcessingStage('Preparing image...');
    
    try {
      // Convert Blob to File if needed
      const fileToProcess = file instanceof File ? file : new File([file], 'capture.jpg', { type: 'image/jpeg' });
      
      setProcessingStage('Extracting text from image...');
      
      // Perform OCR with Tesseract
      const result = await Tesseract.recognize(fileToProcess, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });
      
      setProcessingStage('Analyzing extracted data...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX
      
      const extractedText = result.data.text;
      console.log('OCR Text:', extractedText);
      
      if (!extractedText.trim()) {
        throw new Error('No text found in image');
      }
      
      // Extract data from OCR text
      const extractedData = extractDataFromText(extractedText);
      
      setProcessing(false);
      onSuccess(extractedData);
      
    } catch (error) {
      console.error('OCR processing failed:', error);
      setProcessing(false);
      
      // Still call success with empty data to allow manual entry
      onSuccess({});
    }
  };

  if (showCamera) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            
            <div className="absolute top-4 right-4">
              <Button
                variant="outline"
                size="icon"
                onClick={stopCamera}
                className="bg-background/80 backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Button
                onClick={capturePhoto}
                size="lg"
                className="rounded-full w-16 h-16"
              >
                <Camera className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (processing) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Processing Image</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {processingStage}
              </p>
              {ocrProgress > 0 && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Add Load Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="h-20 flex-col gap-2"
        >
          <Upload className="h-6 w-6" />
          <span className="text-sm">Upload Image</span>
        </Button>
        
        <Button
          onClick={startCamera}
          variant="outline"
          className="h-20 flex-col gap-2"
        >
          <Camera className="h-6 w-6" />
          <span className="text-sm">Take Photo</span>
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}