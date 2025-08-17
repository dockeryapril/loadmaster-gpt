import { z } from "zod";

export const extractionSchema = z.object({
  fields: z.record(z.unknown()),
  confidence: z.number(),
});

export type ExtractionSchema = z.infer<typeof extractionSchema>;
