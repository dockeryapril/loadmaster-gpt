import { makeOpenAI, DEFAULT_OPENAI_MODEL } from "./openaiClient";

export async function extractText(prompt: string): Promise<string> {
  const client = makeOpenAI();
  const response = await client.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0]?.message?.content ?? "";
}
