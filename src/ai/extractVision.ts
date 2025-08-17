import { makeOpenAI, DEFAULT_OPENAI_MODEL } from "./openaiClient";
import { FIELD_EXTRACTION_FEWSHOTS } from "./fewshot";
import { recordExtractionEvent, recordError } from "./telemetry";
import { extractionResponseSchema } from "./extractText";

const FEWSHOT_VISION_INPUT = FIELD_EXTRACTION_FEWSHOTS.map((m) => ({
  role: m.role,
  content: [
    {
      type: m.role === "assistant" ? "output_text" : "input_text",
      text: m.content,
    },
  ],
}));

const FORMAT_INSTRUCTION = {
  role: "system" as const,
  content: [
    {
      type: "input_text" as const,
      text: 'Return only a JSON object in the form {"fields": {...}, "confidence": <0-1>} with no additional text.',
    },
  ],
};

export async function extractVision(imageBase64: string, prompt: string): Promise<string> {
  const start = Date.now();
  try {
    const client = makeOpenAI();
    const response = await client.responses.create({
      model: DEFAULT_OPENAI_MODEL,
      input: [
        ...FEWSHOT_VISION_INPUT,
        FORMAT_INSTRUCTION,
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_base64: imageBase64 },
          ],
        },
      ],
    });
    const text = response.output_text ?? "";
    const parsed = extractionResponseSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      throw new Error("Invalid extraction response");
    }
    recordExtractionEvent({
      source: "extractVision",
      success: true,
      duration: Date.now() - start,
    }).catch(() => {});
    return JSON.stringify(parsed.data);
  } catch (err) {
    recordError(err, { source: "extractVision" }).catch(() => {});
    recordExtractionEvent({
      source: "extractVision",
      success: false,
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }).catch(() => {});
    throw err;
  }
}
