import { callOpenAIWithRateLimit, RateLimitExceededError } from '@/utils/apiWrapper';
import { logError } from '@/utils/errorLogger';
import lexicon from '@/ai/lexicon.json';

const HINT_WORDS = Object.values(lexicon as Record<string, Record<string, string[]>>)
  .flatMap(section => Object.values(section))
  .flat()
  .join(', ');

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
  warnings?: string[];
}

export class SmartFieldDetector {
  private static readonly HIGH_CONFIDENCE_THRESHOLD = 0.7;
  private static readonly MEDIUM_CONFIDENCE_THRESHOLD = 0.4;

  static async detectFields(ocrText: string, enableFuelCostTracking: boolean = false): Promise<FieldDetectionResult> {
    const startTime = performance.now();
    
    try {
      // Create AI prompt for field detection
      const systemMessage = `You are an expert at extracting trucking load information from OCR text.
      Use these hint words to recognize field variations: ${HINT_WORDS}.
      
      Extract the following fields with confidence levels:
      - miles (trip distance, total miles, mi, distance)
      - rate (total pay amount, rate per mile, total rate, may include $ symbol)
      - origin (pickup location, from, origin city/state)
      - destination (delivery location, to, destination city/state)
      - deadhead (deadhead miles, DH, empty miles if mentioned)
      - weight (cargo weight in lbs, pounds, weight)
      - fsc (fuel surcharge, fuel supplement, FSC)
      - tolls (toll costs, tolls, toll charges)${enableFuelCostTracking ? '\n      - fuelCost (fuel cost, fuel expense if enabled)' : ''}
      
      Be generous with confidence scoring. Use "high" confidence for clearly identifiable values,
      "medium" for reasonably identifiable values, and "low" only for very uncertain values.
      
      Look for patterns like:
      - Numbers followed by "mi", "miles", "MI"
      - Dollar amounts with $, amounts per mile
      - City, State format for locations
      - Weight followed by "lbs", "pounds"
      
      Return ONLY a JSON object in this exact format:
      {
        "fields": [
          {"field": "miles", "value": "500", "confidence": "high"},
          {"field": "rate", "value": "1250", "confidence": "medium"}
        ]
      }
      
      Confidence levels:
      - "high": Clearly identifiable value with strong context
      - "medium": Reasonably identifiable value
      - "low": Uncertain value that needs review
      
      If a field is not found, don't include it. Extract all fields you can identify with appropriate confidence.`;

      const prompt = `Extract trucking load information from this OCR text:\n\n${ocrText}`;

      const data = await callOpenAIWithRateLimit(prompt, systemMessage);

      // Parse AI response
      const aiResponse = data.generatedText;
      let parsedFields: DetectedField[] = [];
      
      try {
        const parsed = JSON.parse(aiResponse);
        parsedFields = parsed.fields || [];
      } catch (parseError) {
        logError('Failed to parse AI response:', parseError);
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
      if (error instanceof RateLimitExceededError) {
        throw error;
      }
      logError('Error in AI field detection:', error);
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
    
    // Weighted confidence calculation
    const confidenceScores = { high: 1, medium: 0.6, low: 0.2 };
    const totalScore = fields.reduce((sum, field) => sum + confidenceScores[field.confidence], 0);
    const avgScore = totalScore / fields.length;
    
    // Boost confidence if we have critical fields (miles, rate)
    const hasCriticalFields = fields.some(f => f.field === 'miles' || f.field === 'rate');
    const adjustedScore = hasCriticalFields ? avgScore + 0.1 : avgScore;
    
    if (adjustedScore >= this.HIGH_CONFIDENCE_THRESHOLD) return 'high';
    if (adjustedScore >= this.MEDIUM_CONFIDENCE_THRESHOLD) return 'medium';
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