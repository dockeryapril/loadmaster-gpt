import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE');
const coreLimitPerDay = parseInt(Deno.env.get('CORE_LIMIT_PER_DAY') || '5');
const proLimitPerDay = parseInt(Deno.env.get('PRO_LIMIT_PER_DAY') || '100');
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  const normalizedOrigin = origin.replace(/\/$/, '');
  console.log('Request origin:', origin);
  console.log('Allowed origins:', allowedOrigins);

  // CORS setup with fallback for development and Lovable preview domains
  const isLocalOrigin = /^https?:\/\/localhost(:\d+)?$/.test(normalizedOrigin) ||
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(normalizedOrigin);
  
  // Support Lovable preview domains
  const isLovablePreviewOrigin = /^https:\/\/.*\.lovable\.(app|dev)$/.test(normalizedOrigin);

  const isOriginAllowed = allowedOrigins.length === 0 ||
    allowedOrigins.includes(normalizedOrigin) ||
    isLocalOrigin ||
    isLovablePreviewOrigin;
    
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id, x-user-tier',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  if (isOriginAllowed && origin) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  } else {
    corsHeaders['Access-Control-Allow-Origin'] = 'null';
  }

  // Handle CORS preflight requests first
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only check origin restrictions for non-OPTIONS requests
  if (allowedOrigins.length > 0 && !isOriginAllowed) {
    console.log('Origin not allowed:', origin);
    return new Response(JSON.stringify({ 
      error: 'origin_not_allowed',
      message: 'Origin not allowed'
    }), { 
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Check OpenAI API key first
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not configured');
      return new Response(JSON.stringify({ 
        error: 'configuration_error',
        message: 'OpenAI API key is not configured. Please contact support.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get rate limiting headers
    const deviceId = req.headers.get('x-device-id');
    const rawTier = (req.headers.get('x-user-tier') || 'lite').toLowerCase();
    
    // Normalize tier: both 'core' and 'lite' map to free tier
    const userTier = (rawTier === 'core' || rawTier === 'lite') ? 'lite' : 'pro';

    let currentCount = 1;
    const limit = userTier === 'pro' ? proLimitPerDay : coreLimitPerDay;
    let rateLimitInfo = { currentCount, limit, tier: userTier };

    // Try rate limiting if Supabase is configured
    if (supabaseUrl && supabaseServiceRole && deviceId) {
      try {
        console.log('Rate limiting check for device:', deviceId, 'tier:', userTier);
        
        const supabase = createClient(supabaseUrl, supabaseServiceRole);

        // Check and increment rate limit
        const { data: rateLimitData, error: rateLimitError } = await supabase.rpc('increment_rate_limit', {
          p_device_id: deviceId,
          p_day: new Date().toISOString().split('T')[0]
        });

        if (rateLimitError) {
          console.error('Rate limit check error (continuing without limit):', rateLimitError);
        } else {
          currentCount = rateLimitData;
          rateLimitInfo = { currentCount, limit, tier: userTier };
          
          console.log('Current usage:', currentCount, 'Limit:', limit, 'Tier:', userTier);

          if (currentCount > limit) {
            console.log('Rate limit exceeded for device:', deviceId);
            return new Response(JSON.stringify({ 
              error: 'rate_limit',
              message: userTier === 'lite' 
                ? 'Daily Lite/Core OCR limit reached. Upgrade to Pro for scripts and higher limits.'
                : 'Daily Pro limit reached. Please try again tomorrow.',
              currentCount,
              limit,
              tier: userTier
            }), {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (rateLimitError) {
        console.error('Rate limiting failed (continuing without limit):', rateLimitError);
      }
    } else {
      console.log('Rate limiting skipped - missing configuration or device ID');
    }

    const { prompt, systemMessage, imageBase64 } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('Processing OpenAI request with prompt length:', prompt.length);

    // Prepare messages for chat completions
    const messages = [
      { 
        role: 'system', 
        content: systemMessage || 'You are a helpful assistant that processes and analyzes text data.' 
      }
    ];

    // Add user message with text and optionally image
    if (imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_completion_tokens: 1000,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'field_detection',
            schema: {
              type: 'object',
              properties: {
                fields: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      value: { type: 'string' },
                      confidence: { type: 'string' }
                    },
                    required: ['field', 'value', 'confidence'],
                    additionalProperties: false
                  }
                }
              },
              required: ['fields'],
              additionalProperties: false
            },
            strict: true
          }
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No response generated from OpenAI');
    }

    console.log('Successfully generated response with length:', generatedText.length);

    return new Response(JSON.stringify({ 
      generatedText,
      usage: data.usage,
      rateLimitInfo
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in openai-chat function:', error);
    
    // Provide user-friendly error messages
    let userMessage = 'An unexpected error occurred. Please try again.';
    let statusCode = 500;
    
    if (error.message.includes('OpenAI API error')) {
      userMessage = 'There was an issue processing your request. Please try again.';
    } else if (error.message.includes('Prompt is required')) {
      userMessage = 'Request is missing required data.';
      statusCode = 400;
    } else if (error.message.includes('fetch')) {
      userMessage = 'Network error occurred. Please check your connection and try again.';
    }
    
    return new Response(JSON.stringify({ 
      error: 'function_error',
      message: userMessage,
      details: 'Check function logs for more information'
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
