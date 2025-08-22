import { supabase } from "@/integrations/supabase/client";
import { getDeviceId, getTier } from "./deviceId";

export interface RateLimitError {
  error: 'rate_limit';
  message: string;
  currentCount: number;
  limit: number;
  tier: string;
}

export class RateLimitExceededError extends Error {
  constructor(public rateLimitInfo: RateLimitError) {
    super(rateLimitInfo.message);
    this.name = 'RateLimitExceededError';
  }
}

export async function callOpenAIWithRateLimit(
  prompt: string,
  systemMessage?: string,
  imageBase64?: string
): Promise<{ generatedText: string; usage?: any; rateLimitInfo?: any }> {
  const { data, error } = await supabase.functions.invoke('openai-chat', {
    body: {
      prompt,
      systemMessage,
      imageBase64
    },
    headers: {
      'x-device-id': getDeviceId(),
      'x-user-tier': getTier()
    }
  });

  if (error) {
    if (error?.status === 429 && error.context?.error === 'rate_limit') {
      throw new RateLimitExceededError(error.context);
    }

    throw new Error(`Supabase function error: ${error.message}`);
  }

  return data;
}
