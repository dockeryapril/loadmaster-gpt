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
  try {
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
      throw new Error(`Supabase function error: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    // Handle rate limit errors specifically
    if (error.message?.includes('429') || error.context?.status === 429) {
      const errorData = error.context?.body || {};
      if (errorData.error === 'rate_limit') {
        throw new RateLimitExceededError(errorData);
      }
    }
    
    throw error;
  }
}