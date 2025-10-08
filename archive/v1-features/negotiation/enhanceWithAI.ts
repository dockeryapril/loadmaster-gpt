import { callOpenAIWithRateLimit, RateLimitExceededError } from "@/utils/apiWrapper";

interface EnhanceParams {
  baseScript: string;
  context: string;
}

export async function enhanceWithAI({ baseScript, context }: EnhanceParams): Promise<string> {
  try {
    const prompt = `Improve the following negotiation script based on the context.\n\nContext:\n${context}\n\nScript:\n${baseScript}`;
    const systemMessage = "You enhance negotiation scripts for freight brokers.";
    const { generatedText } = await callOpenAIWithRateLimit(prompt, systemMessage);
    return generatedText;
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      throw err;
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error");
  }
}

export default enhanceWithAI;
