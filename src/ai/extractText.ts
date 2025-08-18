import { supabase } from "@/integrations/supabase/client";
import { FIELD_EXTRACTION_FEWSHOTS } from "./fewshot";
import { recordExtractionEvent, recordError } from "./telemetry";
import { extractionSchema } from "./extractionSchema";

export async function extractText(prompt: string): Promise<string> {
  const start = Date.now();
  try {
    // Create system message with few-shot examples
    const systemMessage = FIELD_EXTRACTION_FEWSHOTS.map(ex => 
      `${ex.role === 'system' ? 'SYSTEM: ' : ex.role === 'user' ? 'USER: ' : 'ASSISTANT: '}${ex.content}`
    ).join('\n\n');

    const { data, error } = await supabase.functions.invoke('openai-chat', {
      body: { 
        prompt, 
        systemMessage: `${systemMessage}\n\nYou extract structured fields from documents and respond with JSON only.`
      }
    });

    if (error) {
      throw new Error(`Supabase function error: ${error.message}`);
    }

    const raw = data?.generatedText ?? "";
    let text = raw;
    try {
      const parsed = extractionSchema.parse(JSON.parse(raw));
      text = JSON.stringify(parsed);
    } catch {
      // Ignore JSON parse or validation errors and return raw text
    }
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
