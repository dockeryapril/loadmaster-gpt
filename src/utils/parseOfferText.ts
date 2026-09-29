export interface ParsedOffer {
  origin?: string;
  destination?: string;
  miles?: string;
  deadheadMiles?: string;
  rate?: string;
  fsc?: string;
  notes?: string;
}

const money = (value: string) => value.replace(/[$,]/g, '');

function firstMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

/**
 * Lightweight, local parser for dispatch/broker offer text.
 * It intentionally fills only high-confidence fields and leaves the rest for review.
 */
export function parseOfferText(raw: string): ParsedOffer {
  const text = raw.replace(/\r/g, '').trim();
  if (!text) return {};

  const origin = firstMatch(text, [
    /(?:PU|PICKUP|ORIGIN|FROM)\s*[:\-]?\s*([^\n]+?)(?=\s+(?:DEL|DELIVERY|DEST|DESTINATION|TO)\b|\n|$)/i,
  ]);
  const destination = firstMatch(text, [
    /(?:DELIVERY|DESTINATION|DEST|DEL|TO)\s*[:\-]?\s*([^\n]+?)(?=\s+(?:\d[\d,]*\s*(?:LOADED|LD|MI|MILES)\b)|\n|$)/i,
  ]);
  const deadheadMiles = firstMatch(text, [
    /(?:DH|DEADHEAD)\s*[:\-]?\s*(\d[\d,]*(?:\.\d+)?)/i,
    /(\d[\d,]*(?:\.\d+)?)\s*(?:DH|DEADHEAD)\b/i,
  ]);
  const miles = firstMatch(text, [
    /(?:LOADED|LD)\s*(?:MILES?|MI)?\s*[:\-]?\s*(\d[\d,]*(?:\.\d+)?)/i,
    /(\d[\d,]*(?:\.\d+)?)\s*(?:LOADED|LD)\b/i,
    /(?:MILES?|MI)\s*[:\-]?\s*(\d[\d,]*(?:\.\d+)?)/i,
  ]);
  const fsc = firstMatch(text, [
    /(?:FSC|FUEL\s*SURCHARGE)\s*[:\-+]?\s*\$?([\d,]+(?:\.\d+)?)/i,
  ]);
  const rate = firstMatch(text, [
    /(?:RATE|LINEHAUL|LINE\s*HAUL|LH|PAY)\s*[:\-]?\s*\$?([\d,]+(?:\.\d+)?)/i,
    /\$([\d,]+(?:\.\d+)?)\s*(?=\+\s*FSC|(?:ALL[- ]?IN)?\b)/i,
    /\$([\d,]+(?:\.\d+)?)/,
  ]);

  return {
    origin,
    destination,
    miles: miles ? money(miles) : undefined,
    deadheadMiles: deadheadMiles ? money(deadheadMiles) : undefined,
    rate: rate ? money(rate) : undefined,
    fsc: fsc ? money(fsc) : undefined,
    notes: text,
  };
}
