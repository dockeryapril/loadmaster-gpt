import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE');
const coreLimitPerDay = parseInt(Deno.env.get('CORE_LIMIT_PER_DAY') || '10');
const proLimitPerDay = parseInt(Deno.env.get('PRO_LIMIT_PER_DAY') || '100');
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  console.log('Request origin:', origin);
  console.log('Allowed origins:', allowedOrigins);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id, x-user-tier',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (!allowedOrigins.includes(origin)) return new Response('Forbidden', { status: 403 });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    if (!supabaseUrl || !supabaseServiceRole) {
      throw new Error('Supabase configuration missing');
    }

    // Get rate limiting headers
    const deviceId = req.headers.get('x-device-id');
    const userTier = req.headers.get('x-user-tier') || 'core';

    if (!deviceId) {
      throw new Error('Device ID is required');
    }

    console.log('Rate limiting check for device:', deviceId, 'tier:', userTier);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    // Check and increment rate limit
    const { data: rateLimitData, error: rateLimitError } = await supabase.rpc('increment_rate_limit', {
      p_device_id: deviceId,
      p_day: new Date().toISOString().split('T')[0]
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      throw new Error('Rate limit check failed');
    }

    const currentCount = rateLimitData;
    const limit = userTier === 'pro' ? proLimitPerDay : coreLimitPerDay;

    console.log('Current usage:', currentCount, 'Limit:', limit, 'Tier:', userTier);

    if (currentCount > limit) {
      console.log('Rate limit exceeded for device:', deviceId);
      return new Response(JSON.stringify({ 
        error: 'rate_limit',
        message: 'Daily free limit reached. Upgrade to Pro to continue.',
        currentCount,
        limit,
        tier: userTier
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
        temperature: 0.3,
        max_tokens: 1000,
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
      rateLimitInfo: {
        currentCount,
        limit,
        tier: userTier
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in openai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});