import OpenAI from "openai";

/**
 * Create a configured OpenAI client using the API key from the environment.
 * @returns an initialized OpenAI client
 * @throws if `OPENAI_API_KEY` is not present
 */
export function makeOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
}
