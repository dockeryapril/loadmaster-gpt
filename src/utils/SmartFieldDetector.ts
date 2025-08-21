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
      // Create AI prompt for field detection with enhanced trucking context
      const systemMessage = `You are an expert at extracting trucking load information from OCR text from load sheets, rate confirmations, and dispatch documents.
      Use these hint words to recognize field variations: ${HINT_WORDS}.
      
      COMMON DOCUMENT LAYOUTS:
      - Load confirmations: "Load #", "Miles:", "Rate:", "From:", "To:", "Weight:"
      - Rate sheets: "$/mile", "Total Miles", "Pickup", "Delivery", "Cargo Weight"  
      - Dispatch sheets: "Origin", "Destination", "Distance", "Pay", "Deadhead"
      
      Extract the following fields with confidence levels:
      - miles (trip distance, total miles, mi, distance, loaded miles)
      - rate (total pay amount, rate per mile, total rate, gross pay, may include $ symbol)
      - origin (pickup location, from, origin city/state, shipper location)
      - destination (delivery location, to, destination city/state, consignee location)
      - deadhead (deadhead miles, DH, empty miles, positioning miles)
      - weight (cargo weight in lbs, pounds, weight, gross weight)
      - fsc (fuel surcharge, fuel supplement, FSC, fuel allowance)
      - tolls (toll costs, tolls, toll charges, toll reimbursement)${enableFuelCostTracking ? '\n      - fuelCost (fuel cost, fuel expense, fuel charges if enabled)' : ''}
      
      CALCULATION RULES:
      - If you see "$/mile" rates, multiply by miles to get total rate
      - Convert weight formats: "25K" = 25000, "15,000#" = 15000
      - Recognize city abbreviations: "CHI" = Chicago, "ATL" = Atlanta
      
      CONFIDENCE GUIDELINES (be generous but accurate):
      - "high": Clear numeric values with proper labels and context
      - "medium": Recognizable values that may need minor interpretation  
      - "low": Ambiguous values requiring human verification
      
      PATTERN RECOGNITION:
      - Miles: Numbers near "mi", "miles", "distance", "loaded"
      - Rate: Dollar amounts near "rate", "pay", "total", per-mile calculations
      - Locations: City/State pairs, ZIP codes, facility names
      - Weight: Numbers near "lbs", "#", "pounds", "weight"
      
      Return ONLY a JSON object in this exact format:
      {
        "fields": [
          {"field": "miles", "value": "500", "confidence": "high"},
          {"field": "rate", "value": "1250", "confidence": "medium"}
        ]
      }
      
      If a field is not found, don't include it. Extract all identifiable fields with appropriate confidence.`;

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
      // Basic validation rules with improved numeric parsing
      if (!field.value || field.value.trim() === '') return false;
      
      switch (field.field) {
        case 'miles':
        case 'deadhead':
        case 'weight':
          // Allow common formats: "500", "1,250", "25K", "15000#"
          const numericValue = field.value.replace(/[^\d]/g, '');
          return numericValue.length > 0 && parseInt(numericValue) > 0;
        case 'rate':
        case 'fsc':
        case 'tolls':
        case 'fuelCost':
          // Allow dollar amounts: "$1,250.00", "1250", "2.50"
          const cleanRate = field.value.replace(/[$,]/g, '');
          return /^\d+(?:\.\d{1,2})?$/.test(cleanRate) && parseFloat(cleanRate) > 0;
        case 'origin':
        case 'destination':
          // Must have at least 3 characters and ideally city/state format
          return field.value.length >= 3;
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