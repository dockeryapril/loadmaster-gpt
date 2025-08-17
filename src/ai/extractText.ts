import { makeOpenAI, DEFAULT_OPENAI_MODEL } from "./openaiClient";
import { FIELD_EXTRACTION_FEWSHOTS } from "./fewshot";
import { recordExtractionEvent, recordError } from "./telemetry";

export async function extractText(prompt: string): Promise<string> {
  const start = Date.now();
  try {
    const client = makeOpenAI();
    const messages = [
      ...FIELD_EXTRACTION_FEWSHOTS,
      { role: "user", content: prompt },
    ];
    const response = await client.chat.completions.create({
      model: DEFAULT_OPENAI_MODEL,
      messages,
    });
    const text = response.choices[0]?.message?.content ?? "";
    recordExtractionEvent({
      source: "extractText",
      success: true,
      duration: Date.now() - start,
    }).catch(() => {});
    return text;
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
