export type FewShotExample = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const FIELD_EXTRACTION_FEWSHOTS: FewShotExample[] = [
  {
    role: "system",
    content:
      "You extract structured fields from documents and respond with JSON only.",
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
