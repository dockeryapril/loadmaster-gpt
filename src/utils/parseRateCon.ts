import type { LoadFormInput } from '@/types/mvp';

const numberFromMatch = (match: RegExpMatchArray | null): string => {
  if (!match?.[1]) return '';
  return match[1].replace(/,/g, '');
};

const extractLine = (text: string, label: RegExp): string => {
  const match = text.match(label);
  if (!match) return '';
  const [, value] = match;
  return value.trim();
};

export const parseRateCon = (raw: string): Partial<LoadFormInput> => {
  if (!raw) return {};

  const text = raw.replace(/\r/g, '').toLowerCase();

  const rateMatch = text.match(/(?:rate|line ?haul|total pay)\D*([\d,.]+)/i);
  const fscMatch = text.match(/(?:fsc|fuel surcharge)\D*([\d,.]+)/i);
  const tollsMatch = text.match(/(?:tolls?)\D*([\d,.]+)/i);
  const fuelMatch = text.match(/(?:fuel cost|fuel advance)\D*([\d,.]+)/i);
  const milesMatch = text.match(/([\d,.]+)\s*(?:mi|miles)/i);

  const pickup = extractLine(raw, /pickup(?: location| city|):?\s*([^\n]+)/i);
  const delivery = extractLine(raw, /(?:delivery|drop(?: ?off)?)\s*:?\s*([^\n]+)/i);

  const form: Partial<LoadFormInput> = {};

  if (rateMatch) form.rate = numberFromMatch(rateMatch);
  if (fscMatch) form.fsc = numberFromMatch(fscMatch);
  if (tollsMatch) form.tolls = numberFromMatch(tollsMatch);
  if (fuelMatch) form.fuelCost = numberFromMatch(fuelMatch);
  if (milesMatch) form.miles = numberFromMatch(milesMatch);

  if (pickup) form.origin = pickup;
  if (delivery) form.destination = delivery;

  return form;
};
