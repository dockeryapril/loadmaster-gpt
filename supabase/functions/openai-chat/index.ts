import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const MONTHLY_LIMITS = {
  free: 5,
  pro: 100,
} as const;
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
  
  // Support Lovable preview domains - updated regex to match actual format
  const isLovablePreviewOrigin = /^https:\/\/[a-zA-Z0-9-]+\.lovable\.(app|dev)$/.test(normalizedOrigin);
  
  console.log('🔍 CORS: Checking origin:', normalizedOrigin);
  console.log('🔍 CORS: Is local origin:', isLocalOrigin);
  console.log('🔍 CORS: Is Lovable preview origin:', isLovablePreviewOrigin);

  const isOriginAllowed = allowedOrigins.length === 0 ||
    allowedOrigins.includes(normalizedOrigin) ||
    isLocalOrigin ||
    isLovablePreviewOrigin;
    
  console.log('🔍 CORS: Is origin allowed:', isOriginAllowed);
    
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    // Check required configuration
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

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase configuration is missing for usage tracking');
      return new Response(JSON.stringify({
        error: 'configuration_error',
        message: 'Supabase configuration is incomplete. Please contact support.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authorization header is required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace(/bearer\s+/i, '').trim();
    if (!token) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Invalid authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      console.error('Failed to authenticate user:', authError);
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'User authentication failed'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, systemMessage, imageBase64 } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'validation_error', message: 'Prompt must be a non-empty string' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (prompt.length > 10000) {
      return new Response(JSON.stringify({ error: 'validation_error', message: 'Prompt exceeds 10,000 character limit' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (systemMessage && typeof systemMessage === 'string' && systemMessage.length > 5000) {
      return new Response(JSON.stringify({ error: 'validation_error', message: 'System message exceeds 5,000 character limit' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing OpenAI request with prompt length:', prompt.length);

    const userId = userData.user.id;

    // Reset usage counters if needed before checking limits
    try {
      await supabase.rpc('reset_usage_if_needed', { p_user_id: userId });
    } catch (resetError) {
      console.error('Failed to reset usage counters:', resetError);
    }

    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('plan, monthly_usage_count, current_period_start')
      .eq('user_id', userId)
      .limit(1);

    if (settingsError) {
      console.error('Error loading user settings:', settingsError);
      throw new Error('Failed to load user settings');
    }

    let plan = 'free';
    let monthlyUsageCount = 0;

    let currentPeriodStart = settingsData?.[0]?.current_period_start ?? null;

    if (settingsData && settingsData.length > 0) {
      plan = (settingsData[0].plan || 'free').toLowerCase() === 'pro' ? 'pro' : 'free';
      monthlyUsageCount = settingsData[0].monthly_usage_count ?? 0;
    } else {
      const { data: insertedSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({ user_id: userId })
        .select('plan, monthly_usage_count, current_period_start')
        .single();

      if (insertError) {
        console.error('Error initializing user settings:', insertError);
        throw new Error('Failed to initialize user settings');
      }

      plan = (insertedSettings?.plan || 'free').toLowerCase() === 'pro' ? 'pro' : 'free';
      monthlyUsageCount = insertedSettings?.monthly_usage_count ?? 0;
      currentPeriodStart = insertedSettings?.current_period_start ?? null;
    }

    const limit = plan === 'pro' ? MONTHLY_LIMITS.pro : MONTHLY_LIMITS.free;

    if (monthlyUsageCount >= limit) {
      console.log('Rate limit exceeded for user:', userId, 'plan:', plan);
      return new Response(JSON.stringify({
        error: 'rate_limit',
        message: plan === 'pro'
          ? 'Monthly Pro limit reached. Please try again after your reset date.'
          : 'Monthly Free limit reached. Upgrade to Pro for higher limits.',
        currentCount: monthlyUsageCount,
        limit,
        tier: plan
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const updatePayload: Record<string, unknown> = {
      monthly_usage_count: monthlyUsageCount + 1,
    };

    if (!currentPeriodStart) {
      const nowIso = new Date().toISOString();
      updatePayload.current_period_start = nowIso;
      currentPeriodStart = nowIso;
    }

    const { data: updatedSettings, error: incrementError } = await supabase
      .from('user_settings')
      .update(updatePayload)
      .eq('user_id', userId)
      .select('monthly_usage_count, current_period_start')
      .single();

    if (incrementError) {
      console.error('Error incrementing usage counter:', incrementError);
      throw new Error('Failed to increment usage counter');
    }

    const currentCount = updatedSettings?.monthly_usage_count ?? monthlyUsageCount + 1;
    currentPeriodStart = updatedSettings?.current_period_start ?? currentPeriodStart;
    const rateLimitInfo = { currentCount, limit, tier: plan };

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
        max_completion_tokens: 1500,
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
    
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API error')) {
        userMessage = 'There was an issue processing your request. Please try again.';
      } else if (error.message.includes('fetch')) {
        userMessage = 'Network error occurred. Please check your connection and try again.';
      }
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
