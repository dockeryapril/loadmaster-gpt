import { callOpenAIWithRateLimit, RateLimitExceededError } from '@/utils/apiWrapper';
import { logError } from '@/utils/errorLogger';
import lexicon from '@/ai/lexicon.json';
import { isDebugMode, debugLog } from '@/utils/debug';

const HINT_WORDS = Object.values(lexicon as Record<string, Record<string, string[]>>)
  .flatMap(section => Object.values(section))
  .flat()
  .join(', ');

export interface DetectedField {
  field: 'miles' | 'rate' | 'origin' | 'destination' | 'deadhead' | 'weight' | 'fsc' | 'tolls' | 'fuelCost' | 'detention' | 'lumper' | 'layover' | 'hazmat';
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
  aiResponse?: string;
}

export class SmartFieldDetector {
  private static readonly HIGH_CONFIDENCE_THRESHOLD = 0.7;
  private static readonly MEDIUM_CONFIDENCE_THRESHOLD = 0.4;

  static async detectFields(ocrText: string, enableFuelCostTracking: boolean = false, abortSignal?: AbortSignal): Promise<FieldDetectionResult> {
    const startTime = performance.now();
    let aiResponse = '';
    const debug = isDebugMode();

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
      - rate (total pay amount, rate per mile, total rate, gross pay, OFFER AMOUNT, TOTAL PAY, GROSS AMOUNT, LOAD PAY, CONTRACT AMOUNT, PAY RATE, may include $ symbol and commas)
      - origin (pickup location, from, origin city/state, shipper location)
      - destination (delivery location, to, destination city/state, consignee location)
      - deadhead (deadhead miles, DH, empty miles, positioning miles)
      - weight (cargo weight in lbs, pounds, weight, gross weight)
      - fsc (fuel surcharge, fuel supplement, FSC, fuel allowance)
      - tolls (toll costs, tolls, toll charges, toll reimbursement)
      - detention (detention pay, wait time pay, delay compensation)
      - lumper (lumper fee, unloading fee, labor charge)
      - layover (layover pay, restart pay, overnight compensation)
      - hazmat (hazmat premium, dangerous goods surcharge, HAZMAT pay)${enableFuelCostTracking ? '\n      - fuelCost (fuel cost, fuel expense, fuel charges if enabled)' : ''}
      
      RATE DETECTION RULES (CRITICAL):
      - ALWAYS prioritize dollar amounts that appear after these labels: "OFFER AMOUNT", "TOTAL PAY", "GROSS AMOUNT", "LOAD PAY", "CONTRACT AMOUNT", "PAY RATE", "TOTAL AMOUNT"
      - Look for patterns like "OFFER AMOUNT $1,405.24" or "TOTAL PAY: $2,500.00"
      - Prefer larger dollar amounts over smaller ones when multiple amounts are present
      - If you see "$/mile" rates, multiply by miles to get total rate
      - Handle comma-separated amounts properly: "$1,405.24" should extract as "1405.24"
      - Ignore small amounts that are likely fees unless clearly labeled as the main rate
      
      OCR ERROR CORRECTION:
      - Convert weight formats: "25K" = 25000, "15,000#" = 15000
      - Recognize city abbreviations: "CHI" = Chicago, "ATL" = Atlanta
      - Fix common OCR errors: "5" vs "S", "0" vs "O", "$" vs "S", "1" vs "l", "," vs "."
      - Validate state codes: convert full state names to 2-letter codes
      - Clean currency: remove extra symbols, fix decimal placement
      
      CONFIDENCE GUIDELINES (be generous but accurate):
      - "high": Clear numeric values with proper labels and context, especially rates with clear labels
      - "medium": Recognizable values that may need minor interpretation  
      - "low": Ambiguous values requiring human verification
      
      PATTERN RECOGNITION:
      - Miles: Numbers near "mi", "miles", "distance", "loaded"
      - Rate: Dollar amounts near "rate", "pay", "total", "offer amount", "gross amount", per-mile calculations
      - Locations: City/State pairs, ZIP codes, facility names
      - Weight: Numbers near "lbs", "#", "pounds", "weight"
      - Accessorials: Look for detention, lumper, layover, hazmat with associated amounts
      
      Return ONLY a JSON object in this exact format:
      {
        "fields": [
          {"field": "miles", "value": "500", "confidence": "high"},
          {"field": "rate", "value": "1250", "confidence": "medium"}
        ]
      }
      
      If a field is not found, don't include it. Extract all identifiable fields with appropriate confidence.`;

      const prompt = `Extract trucking load information from this OCR text:\n\n${ocrText}`;

      // Check if cancelled before AI call
      if (abortSignal?.aborted) {
        throw new Error('Upload cancelled');
      }

      const data = await callOpenAIWithRateLimit(prompt, systemMessage, undefined, abortSignal);

      // Parse AI response
      aiResponse = data.generatedText;
      if (debug) {
        debugLog('OpenAI response:', aiResponse);
      }
      let parsedFields: DetectedField[] = [];
      
      try {
        const parsed = JSON.parse(aiResponse);
        parsedFields = parsed.fields || [];
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiResponse, parseError);
        logError('Failed to parse AI response', parseError, { aiResponse });
        return this.fallbackDetection(ocrText, startTime, aiResponse);
      }

      // Validate and clean up detected fields, filter out fuel cost if disabled
      const validatedFields = this.validateFields(parsedFields).filter(field =>
        enableFuelCostTracking || field.field !== 'fuelCost'
      );
      if (debug) {
        debugLog('Detected fields:', validatedFields);
      }
      const overallConfidence = this.calculateOverallConfidence(validatedFields);

      const processingTime = performance.now() - startTime;

      return {
        detectedFields: validatedFields,
        processingTime,
        rawText: ocrText,
        confidence: overallConfidence,
        aiResponse: debug ? aiResponse : undefined
      };

    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        throw error;
      }
      logError('Error in AI field detection:', error, { aiResponse, ocrText });
      return this.fallbackDetection(ocrText, startTime, aiResponse);
    }
  }

  private static fallbackDetection(ocrText: string, startTime: number, aiResponse = ''): FieldDetectionResult {
    const debug = isDebugMode();
    if (debug) {
      debugLog('Using fallback pattern detection');
    }
    const fields: DetectedField[] = [];

    // Enhanced regex patterns for better trucking terminology recognition
    const patterns = {
      miles: /(\d+)\s*(miles?|mi\.?)/i,
      rate: [
        // Priority patterns for specific rate labels
        /(?:offer\s*amount|total\s*pay|gross\s*amount|load\s*pay|contract\s*amount|pay\s*rate|total\s*amount)[\s:]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        // General rate patterns
        /(?:rate|pay|total)[\s:]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        // Fallback for any dollar amount (lowest priority)
        /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/
      ],
      origin: /(?:from|pickup|origin)[\s:]*([A-Z][a-z]+,?\s*[A-Z]{2})/i,
      destination: /(?:to|delivery|dest)[\s:]*([A-Z][a-z]+,?\s*[A-Z]{2})/i,
      deadhead: /(?:deadhead|dh|dead\s*head|empty\s*miles?)[\s:]*(\d+)/i,
      weight: /(\d+(?:,\d{3})*)\s*(?:lbs?|pounds?)/i,
      detention: /(?:detention|wait\s*time|delay)[\s:]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      lumper: /(?:lumper|unload|labor)[\s:]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      layover: /(?:layover|restart|overnight)[\s:]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      hazmat: /(?:hazmat|dangerous\s*goods|haz)[\s:]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
    };

    const numericFields = new Set(['miles', 'rate', 'deadhead', 'weight', 'detention', 'lumper', 'layover', 'hazmat']);

    for (const [field, patternOrArray] of Object.entries(patterns)) {
      let match = null;
      let matchValue = null;
      
      // Handle rate field with multiple priority patterns
      if (field === 'rate' && Array.isArray(patternOrArray)) {
        // Try patterns in order of priority
        for (const pattern of patternOrArray) {
          match = ocrText.match(pattern);
          if (match && match[1]) {
            matchValue = match[1];
            if (debug) {
              debugLog(`Rate detected with pattern: ${pattern.toString()}, value: ${matchValue}`);
            }
            break;
          }
        }
      } else {
        // Handle other fields with single pattern
        const pattern = patternOrArray as RegExp;
        match = ocrText.match(pattern);
        if (match && match[1]) {
          matchValue = match[1];
        }
      }
      
      if (matchValue) {
        // For rate field, prefer higher confidence if detected with priority patterns
        let confidence: 'high' | 'medium' | 'low' = numericFields.has(field) ? 'medium' : 'low';
        
        if (field === 'rate' && Array.isArray(patternOrArray)) {
          // Higher confidence for priority patterns (first pattern in array)
          const firstPatternMatch = ocrText.match(patternOrArray[0]);
          if (firstPatternMatch && firstPatternMatch[1] === matchValue) {
            confidence = 'high';
          }
        }
        
        fields.push({
          field: field as DetectedField['field'],
          value: matchValue,
          confidence
        });
      }
    }

    const processingTime = performance.now() - startTime;
    const overallConfidence = this.calculateOverallConfidence(fields, true);
    if (isDebugMode()) {
      debugLog('Fallback detected fields:', fields);
    }

    return {
      detectedFields: fields,
      processingTime,
      rawText: ocrText,
      confidence: overallConfidence,
      aiResponse: isDebugMode() ? aiResponse : undefined
    };
  }

  private static validateFields(fields: DetectedField[]): DetectedField[] {
    const debug = isDebugMode();
    return fields.filter(field => {
      // Basic validation rules with improved numeric parsing
      if (!field.value || field.value.trim() === '') return false;
      
      switch (field.field) {
        case 'miles':
        case 'deadhead':
        case 'weight': {
          // Allow common formats: "500", "1,250", "25K", "15000#"
          const numericValue = field.value.replace(/[^\d]/g, '');
          return numericValue.length > 0 && parseInt(numericValue) > 0;
        }
        case 'rate':
        case 'fsc':
        case 'tolls':
        case 'fuelCost':
        case 'detention':
        case 'lumper':
        case 'layover':
        case 'hazmat': {
          // Enhanced validation for dollar amounts: "$1,250.00", "1250", "2.50", "1,405.24"
          const cleanRate = field.value.replace(/[$,\s]/g, '');
          const isValid = /^\d+(?:\.\d{1,2})?$/.test(cleanRate) && parseFloat(cleanRate) > 0;
          
          if (debug && field.field === 'rate') {
            debugLog(`Rate validation - original: ${field.value}, cleaned: ${cleanRate}, valid: ${isValid}`);
          }
          
          return isValid;
        }
        case 'origin':
        case 'destination':
          // Must have at least 3 characters and ideally city/state format
          return field.value.length >= 3;
        default:
          return true;
      }
    });
  }

  private static calculateOverallConfidence(fields: DetectedField[], isFallback: boolean = false): 'high' | 'medium' | 'low' {
    if (fields.length === 0) return 'low';

    // Weighted confidence calculation
    const confidenceScores = { high: 1, medium: 0.6, low: 0.2 };
    const totalScore = fields.reduce((sum, field) => sum + confidenceScores[field.confidence], 0);
    const avgScore = totalScore / fields.length;

    // Boost confidence if we have critical fields (miles, rate)
    const hasCriticalFields = fields.some(f => f.field === 'miles' || f.field === 'rate');

    let adjustedScore = hasCriticalFields ? avgScore + 0.1 : avgScore;

    // In fallback mode, account for limited field coverage
    if (isFallback) {
      const coverage = Math.min(fields.length / 4, 1); // consider 4 core fields
      adjustedScore = avgScore * coverage + (hasCriticalFields ? 0.1 : 0);
    }

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