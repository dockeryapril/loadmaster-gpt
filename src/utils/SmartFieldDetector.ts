import { supabase } from '@/integrations/supabase/client';

export interface DetectedField {
  field: 'miles' | 'rate' | 'origin' | 'destination' | 'deadhead' | 'weight' | 'fsc' | 'tolls' | 'fuelCost';
  value: string;
  confidence: 'high' | 'medium' | 'low';
  position?: { start: number; end: number };
}

export interface FieldDetectionResult {
  detectedFields: DetectedField[];
  processingTime: number;
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
}

export class SmartFieldDetector {
  private static readonly HIGH_CONFIDENCE_THRESHOLD = 0.8;
  private static readonly MEDIUM_CONFIDENCE_THRESHOLD = 0.5;

  static async detectFields(ocrText: string, enableFuelCostTracking: boolean = false): Promise<FieldDetectionResult> {
    const startTime = performance.now();
    
    try {
      // Create AI prompt for field detection
      const systemMessage = `You are an expert at extracting trucking load information from OCR text. 
      Extract the following fields with confidence levels:
      - miles (trip distance)
      - rate (total pay amount, may include $ symbol)
      - origin (pickup city/state)
      - destination (delivery city/state)  
      - deadhead (deadhead miles if mentioned)
      - weight (cargo weight in lbs)
      - fsc (fuel surcharge)
      - tolls (toll costs)${enableFuelCostTracking ? '\n      - fuelCost (fuel cost if enabled)' : ''}
      
      Return ONLY a JSON object in this exact format:
      {
        "fields": [
          {"field": "miles", "value": "500", "confidence": "high"},
          {"field": "rate", "value": "1250", "confidence": "medium"}
        ]
      }
      
      Confidence levels:
      - "high": Very certain about the value
      - "medium": Somewhat certain, may need review
      - "low": Uncertain, definitely needs review
      
      If a field is not found, don't include it. Only return fields you can identify.`;

      const prompt = `Extract trucking load information from this OCR text:\n\n${ocrText}`;

      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: { prompt, systemMessage }
      });

      if (error) {
        console.error('AI field detection failed:', error);
        return this.fallbackDetection(ocrText, startTime);
      }

      // Parse AI response
      const aiResponse = data.generatedText;
      let parsedFields: DetectedField[] = [];
      
      try {
        const parsed = JSON.parse(aiResponse);
        parsedFields = parsed.fields || [];
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        return this.fallbackDetection(ocrText, startTime);
      }

      // Validate and clean up detected fields, filter out fuel cost if disabled
      const validatedFields = this.validateFields(parsedFields).filter(field => 
        enableFuelCostTracking || field.field !== 'fuelCost'
      );
      const overallConfidence = this.calculateOverallConfidence(validatedFields);
      
      const processingTime = performance.now() - startTime;
      
      return {
        detectedFields: validatedFields,
        processingTime,
        rawText: ocrText,
        confidence: overallConfidence
      };

    } catch (error) {
      console.error('Error in AI field detection:', error);
      return this.fallbackDetection(ocrText, startTime);
    }
  }

  private static fallbackDetection(ocrText: string, startTime: number): FieldDetectionResult {
    console.log('Using fallback pattern detection');
    const fields: DetectedField[] = [];
    
    // Basic regex patterns for common formats
    const patterns = {
      miles: /(\d+)\s*(miles?|mi\.?)/i,
      rate: /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/,
      origin: /(?:from|pickup|origin)[\s:]*([A-Z][a-z]+,?\s*[A-Z]{2})/i,
      destination: /(?:to|delivery|dest)[\s:]*([A-Z][a-z]+,?\s*[A-Z]{2})/i,
      deadhead: /(?:deadhead|dh)[\s:]*(\d+)/i,
      weight: /(\d+(?:,\d{3})*)\s*(?:lbs?|pounds?)/i
    };

    for (const [field, pattern] of Object.entries(patterns)) {
      const match = ocrText.match(pattern);
      if (match && match[1]) {
        fields.push({
          field: field as DetectedField['field'],
          value: match[1],
          confidence: 'low' // Fallback always low confidence
        });
      }
    }

    const processingTime = performance.now() - startTime;
    
    return {
      detectedFields: fields,
      processingTime,
      rawText: ocrText,
      confidence: 'low'
    };
  }

  private static validateFields(fields: DetectedField[]): DetectedField[] {
    return fields.filter(field => {
      // Basic validation rules
      if (!field.value || field.value.trim() === '') return false;
      
      switch (field.field) {
        case 'miles':
        case 'deadhead':
        case 'weight':
          return /^\d+$/.test(field.value.replace(',', ''));
        case 'rate':
        case 'fsc':
        case 'tolls':
          return /^\d+(?:\.\d{2})?$/.test(field.value.replace(/[$,]/g, ''));
        case 'origin':
        case 'destination':
          return field.value.length > 2;
        default:
          return true;
      }
    });
  }

  private static calculateOverallConfidence(fields: DetectedField[]): 'high' | 'medium' | 'low' {
    if (fields.length === 0) return 'low';
    
    const highConfidenceCount = fields.filter(f => f.confidence === 'high').length;
    const totalFields = fields.length;
    
    if (highConfidenceCount / totalFields >= this.HIGH_CONFIDENCE_THRESHOLD) return 'high';
    if (highConfidenceCount / totalFields >= this.MEDIUM_CONFIDENCE_THRESHOLD) return 'medium';
    return 'low';
  }

  // Simple pattern learning system
  static saveUserCorrection(originalValue: string, correctedValue: string, field: string) {
    const corrections = JSON.parse(localStorage.getItem('ocr_corrections') || '{}');
    
    if (!corrections[field]) corrections[field] = {};
    corrections[field][originalValue] = correctedValue;
    
    localStorage.setItem('ocr_corrections', JSON.stringify(corrections));
  }

  static applyLearnedCorrections(fields: DetectedField[]): DetectedField[] {
    const corrections = JSON.parse(localStorage.getItem('ocr_corrections') || '{}');
    
    return fields.map(field => {
      const fieldCorrections = corrections[field.field];
      if (fieldCorrections && fieldCorrections[field.value]) {
        return {
          ...field,
          value: fieldCorrections[field.value],
          confidence: field.confidence === 'low' ? 'medium' : field.confidence
        };
      }
      return field;
    });
  }
}