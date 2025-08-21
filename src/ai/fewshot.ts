export type FewShotExample = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const FIELD_EXTRACTION_FEWSHOTS: FewShotExample[] = [
  {
    role: "system",
    content: "You extract structured fields from trucking load documents and respond with JSON only.",
  },
  {
    role: "user",
    content: "Load #: ABC123\nMiles: 450\nRate: $1,350.00\nFrom: Dallas, TX\nTo: Atlanta, GA\nWeight: 25,000 lbs",
  },
  {
    role: "assistant",
    content: '{ "fields": [{"field": "miles", "value": "450", "confidence": "high"}, {"field": "rate", "value": "1350", "confidence": "high"}, {"field": "origin", "value": "Dallas, TX", "confidence": "high"}, {"field": "destination", "value": "Atlanta, GA", "confidence": "high"}, {"field": "weight", "value": "25000", "confidence": "high"}] }',
  },
  {
    role: "user", 
    content: "Total Miles 328 mi\n$2.45/mile\nPickup: Chicago IL\nDelivery: Indianapolis IN\nCargo: 15000# steel coils",
  },
  {
    role: "assistant",
    content: '{ "fields": [{"field": "miles", "value": "328", "confidence": "high"}, {"field": "rate", "value": "803.60", "confidence": "medium"}, {"field": "origin", "value": "Chicago, IL", "confidence": "high"}, {"field": "destination", "value": "Indianapolis, IN", "confidence": "high"}, {"field": "weight", "value": "15000", "confidence": "high"}] }',
  },
  {
    role: "user",
    content: "Shipper: Acme Corp\nConsignee: Beta LLC",
  },
  {
    role: "assistant",
    content: '{ "shipper": "Acme Corp", "consignee": "Beta LLC" }',
  },
];
