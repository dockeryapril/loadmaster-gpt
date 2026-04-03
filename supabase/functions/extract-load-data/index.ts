import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_BASE64_LENGTH = 15 * 1024 * 1024; // 15MB for base64 string

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase configuration missing');
      return new Response(JSON.stringify({ 
        error: 'configuration_error',
        message: 'Service configuration incomplete' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace(/bearer\s+/i, '').trim();
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Invalid authentication token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('OCR request from user:', userData.user.id);
    const contentType = req.headers.get('content-type') || '';
    let imageBase64: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      const base64FromForm = formData.get('imageBase64');

      if (typeof base64FromForm === 'string' && base64FromForm.length > 0) {
        imageBase64 = base64FromForm;
      } else if (typeof file === 'string' && file.length > 0) {
        imageBase64 = file;
      } else if (file instanceof File) {
        if (file.size > MAX_FILE_SIZE) {
          return new Response(JSON.stringify({
            error: 'file_too_large',
            message: 'Images larger than 10MB are not supported. Try a smaller file.',
          }), {
            status: 413,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64String = base64Encode(new Uint8Array(arrayBuffer));
        const mimeType = file.type || 'image/jpeg';
        imageBase64 = `data:${mimeType};base64,${base64String}`;
      }
    } else if (contentType.includes('application/octet-stream')) {
      const arrayBuffer = await req.arrayBuffer();
      if (arrayBuffer.byteLength > 0) {
        if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
          return new Response(JSON.stringify({
            error: 'file_too_large',
            message: 'Images larger than 10MB are not supported. Try a smaller file.',
          }), {
            status: 413,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const base64String = base64Encode(new Uint8Array(arrayBuffer));
        const mimeType = req.headers.get('x-file-type') || 'image/jpeg';
        imageBase64 = `data:${mimeType};base64,${base64String}`;
      }
    } else {
      try {
        const body = await req.json();
        imageBase64 = body?.imageBase64;
      } catch (_error) {
        console.warn('Unsupported request body for OCR extraction');
      }
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({
        error: 'missing_image',
        message: 'Image data is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate base64 string length
    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return new Response(JSON.stringify({
        error: 'image_too_large',
        message: 'Image data exceeds maximum size'
      }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate base64 format
    if (!imageBase64.startsWith('data:image/')) {
      return new Response(JSON.stringify({
        error: 'invalid_format',
        message: 'Invalid image format'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ 
        error: 'configuration_error',
        message: 'OCR service not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Calling Lovable AI Gateway for OCR extraction...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'user', 
            content: [
              { 
                type: 'text', 
                text: 'Extract load details from this rate confirmation or load board screenshot. Look for origin city/state, destination city/state, loaded miles, deadhead miles (if explicitly shown), linehaul rate (base pay), FSC (fuel surcharge), tolls, and weight in pounds. Return structured data with confidence score. If deadhead is not explicitly shown, omit it.' 
              },
              { 
                type: 'image_url', 
                image_url: { url: imageBase64 } 
              }
            ]
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_load_data',
            description: 'Extract structured load data from rate confirmation image',
            parameters: {
              type: 'object',
              properties: {
                origin: { 
                  type: 'string', 
                  description: 'Origin city and state (e.g., "Chicago, IL")' 
                },
                destination: { 
                  type: 'string', 
                  description: 'Destination city and state (e.g., "Atlanta, GA")' 
                },
                miles: { 
                  type: 'string', 
                  description: 'Total miles as string (will be parsed to number)' 
                },
                deadheadMiles: {
                  type: 'string',
                  description: 'Deadhead miles as string when explicitly provided (e.g., "80")'
                },
                rate: { 
                  type: 'string', 
                  description: 'Base linehaul rate in dollars as string (e.g., "1250.00")' 
                },
                fsc: { 
                  type: 'string', 
                  description: 'Fuel surcharge in dollars as string (e.g., "87.50")' 
                },
                tolls: { 
                  type: 'string', 
                  description: 'Toll amount in dollars as string (e.g., "25.00")' 
                },
                weight: { 
                  type: 'string', 
                  description: 'Weight in pounds as string (e.g., "42000")' 
                },
                loadReference: { 
                  type: 'string', 
                  description: 'Load number, reference ID, or broker name' 
                },
                confidence: { 
                  type: 'number', 
                  description: 'Confidence score between 0 and 1' 
                }
              },
              required: ['origin', 'destination', 'miles', 'rate', 'confidence']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_load_data' } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'rate_limit',
          message: 'Too many OCR requests. Please try again in a moment or enter data manually.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'payment_required',
          message: 'AI credits depleted. Manual entry is always available!' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('AI Gateway response received');
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error('No tool call found in response');
      return new Response(JSON.stringify({ 
        error: 'extraction_failed',
        message: 'Could not extract data from image. Try a clearer photo.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log('Extracted data:', { 
      origin: extractedData.origin, 
      destination: extractedData.destination,
      confidence: extractedData.confidence 
    });

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('extract-load-data error:', error);
    return new Response(JSON.stringify({ 
      error: 'extraction_failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
