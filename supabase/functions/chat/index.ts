import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// OpenRouter free models
const FREE_MODELS = {
  'gemini': 'google/gemini-2.0-flash-lite-001',
  'deepseek': 'deepseek/deepseek-chat',
  'llama': 'meta-llama/llama-3.2-3b-instruct:free',
  'mistral': 'mistralai/mistral-7b-instruct:free',
  'phi': 'microsoft/phi-3-mini-128k-instruct:free',
  'claude': 'anthropic/claude-3-haiku:beta',
  'gpt': 'openai/gpt-3.5-turbo-0613',
};

async function callOpenRouter(messages: any[], model: string): Promise<any> {
  const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

  if (!openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY belum dikonfigurasi');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterApiKey}`,
      'HTTP-Referer': 'https://kurocodex.ai',
      'X-Title': 'KuroCodex API',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // GET /chat/models - List available models
    if (req.method === 'GET' && path.includes('/models')) {
      const models = Object.entries(FREE_MODELS).map(([name, id]) => ({
        name,
        id,
        provider: id.split('/')[0],
        free: true,
      }));

      return new Response(JSON.stringify({
        success: true,
        models,
        total: models.length
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /chat - Chat with AI
    if (req.method === 'POST' && path.endsWith('/chat')) {
      const authHeader = req.headers.get('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'API key diperlukan. Header: Authorization: Bearer YOUR_API_KEY'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const apiKey = authHeader.replace('Bearer ', '');

      // Verify API key and get user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, username, role, is_active')
        .eq('api_key', apiKey)
        .maybeSingle();

      if (userError || !user) {
        return new Response(JSON.stringify({
          success: false,
          error: 'API key tidak valid'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!user.is_active) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Akun tidak aktif. Hubungi admin.'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const body = await req.json();
      const { messages, model = 'gemini' } = body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Messages array diperlukan. Format: [{"role": "user", "content": "Halo"}]'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get model ID
      const modelId = FREE_MODELS[model] || model;

      const startTime = Date.now();

      try {
        const result = await callOpenRouter(messages, modelId);
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

        const message = result.choices?.[0]?.message?.content || '';
        const tokens = result.usage?.total_tokens || 0;

        // Log usage
        await supabase
          .from('api_usage_logs')
          .insert({
            user_id: user.id,
            model: modelId,
            tokens_used: tokens,
            status: 'success',
          });

        return new Response(JSON.stringify({
          success: true,
          model: modelId,
          message,
          usage: {
            prompt_tokens: result.usage?.prompt_tokens || 0,
            completion_tokens: result.usage?.completion_tokens || 0,
            total_tokens: tokens,
          },
          response_time: `${responseTime}s`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        // Log failed request
        await supabase
          .from('api_usage_logs')
          .insert({
            user_id: user.id,
            model: modelId,
            tokens_used: 0,
            status: 'failed',
            error_message: error.message,
          });

        throw error;
      }
    }

    // Health check
    if (req.method === 'GET' && path.includes('/health')) {
      return new Response(JSON.stringify({
        success: true,
        service: 'KuroCodex Chat API',
        status: 'healthy',
        models_available: Object.keys(FREE_MODELS).length
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint tidak ditemukan. Gunakan POST /chat atau GET /models'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Terjadi kesalahan server'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
