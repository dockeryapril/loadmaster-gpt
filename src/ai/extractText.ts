import { makeOpenAI, DEFAULT_OPENAI_MODEL } from "./openaiClient";
import { FIELD_EXTRACTION_FEWSHOTS } from "./fewshot";

export async function extractText(prompt: string): Promise<string> {
  const client = makeOpenAI();
  const messages = [
    ...FIELD_EXTRACTION_FEWSHOTS,
    { role: "user", content: prompt },
  ];
  const response = await client.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    messages,
  });
  return response.choices[0]?.message?.content ?? "";
}
