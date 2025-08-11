export interface PreprocessingResult {
  processedImageUrl: string;
  originalSize: { width: number; height: number };
  processedSize: { width: number; height: number };
  processingTime: number;
}

export class OCRPreprocessor {
  private static readonly MAX_WIDTH = 2048;
  private static readonly MAX_HEIGHT = 2048;
  private static readonly QUALITY = 0.8;

  static async preprocessImage(file: File): Promise<PreprocessingResult> {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        const originalSize = { width: img.width, height: img.height };

        // Calculate optimal dimensions, further limiting size on small screens
        const viewportWidth =
          typeof window !== 'undefined' ? window.innerWidth : this.MAX_WIDTH;
        const mobileCap = viewportWidth * 2; // account for device pixel ratio
        const maxWidth = Math.min(this.MAX_WIDTH, mobileCap);
        const maxHeight = Math.min(this.MAX_HEIGHT, mobileCap);
        const scale = Math.min(
          maxWidth / img.width,
          maxHeight / img.height,
          1 // Don't upscale
        );

        const newWidth = Math.floor(img.width * scale);
        const newHeight = Math.floor(img.height * scale);
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Apply preprocessing filters for better OCR
        ctx.filter = 'contrast(1.2) brightness(1.1) saturate(0.8)';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert to blob
        const maxOriginalDimension = Math.max(img.width, img.height);
        let quality = this.QUALITY;
        if (maxOriginalDimension > 4000) {
          quality = 0.6;
        } else if (maxOriginalDimension > 3000) {
          quality = 0.7;
        }

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to process image'));
            return;
          }
          
          const processedImageUrl = URL.createObjectURL(blob);
          const processingTime = performance.now() - startTime;
          
          resolve({
            processedImageUrl,
            originalSize,
            processedSize: { width: newWidth, height: newHeight },
            processingTime
          });
        }, 'image/jpeg', quality);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  static cleanup(imageUrl: string) {
    URL.revokeObjectURL(imageUrl);
  }
}
