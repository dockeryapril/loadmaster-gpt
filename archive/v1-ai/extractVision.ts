import { callOpenAIWithRateLimit, RateLimitExceededError } from "@/utils/apiWrapper";
import { FIELD_EXTRACTION_FEWSHOTS } from "./fewshot";
import { recordExtractionEvent, recordError } from "./telemetry";
import { extractionSchema } from "./extractionSchema";

export async function extractVision(imageBase64: string, prompt: string): Promise<string> {
  const start = Date.now();
  try {
    // Create system message with few-shot examples
    const systemMessage = FIELD_EXTRACTION_FEWSHOTS.map(ex => 
      `${ex.role === 'system' ? 'SYSTEM: ' : ex.role === 'user' ? 'USER: ' : 'ASSISTANT: '}${ex.content}`
    ).join('\n\n');

    const data = await callOpenAIWithRateLimit(
      prompt, 
      `${systemMessage}\n\nYou extract structured fields from documents and respond with JSON only.`,
      imageBase64
    );

    const raw = data?.generatedText ?? "";
    let text = raw;
    try {
      const parsed = extractionSchema.parse(JSON.parse(raw));
      text = JSON.stringify(parsed);
    } catch {
      // Ignore JSON parse or validation errors and return raw text
    }
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
