import { makeOpenAI, DEFAULT_OPENAI_MODEL } from "./openaiClient";
import { FIELD_EXTRACTION_FEWSHOTS } from "./fewshot";
import { recordExtractionEvent, recordError } from "./telemetry";

const FEWSHOT_VISION_INPUT = FIELD_EXTRACTION_FEWSHOTS.map((m) => ({
  role: m.role,
  content: [
    {
      type: m.role === "assistant" ? "output_text" : "input_text",
      text: m.content,
    },
  ],
}));

export async function extractVision(imageBase64: string, prompt: string): Promise<string> {
  const start = Date.now();
  try {
    const client = makeOpenAI();
    const response = await client.responses.create({
      model: DEFAULT_OPENAI_MODEL,
      input: [
        ...FEWSHOT_VISION_INPUT,
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
    recordExtractionEvent({
      source: "extractVision",
      success: true,
      duration: Date.now() - start,
    }).catch(() => {});
    return text;
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
