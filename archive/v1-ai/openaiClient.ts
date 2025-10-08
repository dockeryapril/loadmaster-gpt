import OpenAI from "openai";

export const DEFAULT_OPENAI_MODEL = "gpt-5-mini-2025-08-07";

export function makeOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
}
