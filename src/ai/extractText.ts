import { makeOpenAI, DEFAULT_OPENAI_MODEL } from "./openaiClient";
import { FIELD_EXTRACTION_FEWSHOTS } from "./fewshot";
import { recordExtractionEvent, recordError } from "./telemetry";
import { z } from "zod";

export const extractionResponseSchema = z.object({
  fields: z.record(z.string()),
  confidence: z.number().min(0).max(1),
});

export async function extractText(prompt: string): Promise<string> {
  const start = Date.now();
  try {
    const client = makeOpenAI();
    const messages = [
      ...FIELD_EXTRACTION_FEWSHOTS,
      {
        role: "system",
        content:
          'Return only a JSON object in the form {"fields": {...}, "confidence": <0-1>} with no additional text.',
      },
      { role: "user", content: prompt },
    ];
    const response = await client.chat.completions.create({
      model: DEFAULT_OPENAI_MODEL,
      messages,
    });
    const text = response.choices[0]?.message?.content ?? "";
    const parsed = extractionResponseSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      throw new Error("Invalid extraction response");
    }
    recordExtractionEvent({
      source: "extractText",
      success: true,
      duration: Date.now() - start,
    }).catch(() => {});
    return JSON.stringify(parsed.data);
  } catch (err) {
    recordError(err, { source: "extractText" }).catch(() => {});
    recordExtractionEvent({
      source: "extractText",
      success: false,
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }).catch(() => {});
    throw err;
  }
}
