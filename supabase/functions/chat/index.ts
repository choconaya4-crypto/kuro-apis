import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const FREE_MODELS = {
  gemini:   'google/gemini-2.0-flash-lite-001',
  deepseek: 'deepseek/deepseek-chat',
  llama:    'meta-llama/llama-3.2-3b-instruct:free',
  mistral:  'mistralai/mistral-7b-instruct:free',
  phi:      'microsoft/phi-3-mini-128k-instruct:free',
  gpt:      'openai/gpt-3.5-turbo-0613',
};

const LOCAL_MODELS = ['claude', 'copilot'];

const UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
];

const randUA  = () => UAS[Math.floor(Math.random() * UAS.length)];
const randVer = () => String(130 + Math.floor(Math.random() * 5));

// ─── Claude via DeepAI ───────────────────────────────────────────────
async function callDeepAI(messages) {
  const form = new FormData();
  form.append('chat_style',             'claudeai_0');
  form.append('chatHistory',            JSON.stringify(messages));
  form.append('model',                  'standard');
  form.append('session_uuid',           crypto.randomUUID());
  form.append('sensitivity_request_id', crypto.randomUUID());
  form.append('hacker_is_stinky',       'very_stinky');
  form.append('enabled_tools',          JSON.stringify(['image_generator', 'image_editor']));

  const v = randVer();
  const response = await fetch('https://api.deepai.org/hacking_is_a_serious_crime', {
    method: 'POST',
    headers: {
      'api-key':            'tryit-61180926040-f45718959fea9f0a04999506c579a399',
      'user-agent':         randUA(),
      'origin':             'https://deepai.org',
      'referer':            'https://deepai.org/',
      'accept':             '*/*',
      'accept-language':    'id-ID,id;q=0.9,en;q=0.8',
      'sec-ch-ua':          `"Chromium";v="${v}", "Not:A-Brand";v="24"`,
      'sec-ch-ua-mobile':   '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-site':     'same-site',
      'sec-fetch-mode':     'cors',
      'sec-fetch-dest':     'empty',
    },
    body: form,
    signal: AbortSignal.timeout(30000),
  });

  const data = await response.json().catch(() => null);
  if (!data) throw new Error('Tidak ada respons dari server');

  let reply = '';
  if (typeof data === 'string') reply = data;
  else if (data.output)         reply = data.output;
  else if (data.response)       reply = data.response;
  else if (data.error)          throw new Error('DeepAI: ' + data.error);
  else                          reply = JSON.stringify(data);

  const trimmed = reply.trim();
  if (!trimmed) throw new Error('Respons kosong dari DeepAI');
  return trimmed;
}

async function claudeChat(messages) {
  let lastErr = new Error('Unknown');
  for (let i = 0; i < 3; i++) {
    try { return await callDeepAI(messages); }
    catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));
    }
  }
  throw new Error('Claude gagal (3x retry): ' + lastErr.message);
}

// ─── Copilot via WebSocket ───────────────────────────────────────────
const COPILOT_MODELS = {
  'copilot':        'chat',
  'copilot-think':  'reasoning',
  'copilot-smart':  'smart',
};

const COPILOT_HEADERS = {
  origin:       'https://copilot.microsoft.com',
  'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
};

async function copilotChat(messages, model = 'copilot') {
  const mode = COPILOT_MODELS[model] || 'chat';
  const prompt = messages[messages.length - 1]?.content || '';

  // Step 1: create conversation
  const convRes = await fetch('https://copilot.microsoft.com/c/api/conversations', {
    method: 'POST',
    headers: COPILOT_HEADERS,
    signal: AbortSignal.timeout(10000),
  });

  if (!convRes.ok) throw new Error('Copilot: gagal buat conversation');
  const convData = await convRes.json();
  const conversationId = convData.id;

  // Step 2: WebSocket — Deno supports native WebSocket
  return new Promise((resolve, reject) => {
    const wsUrl = 'wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1';
    const ws = new WebSocket(wsUrl);
    const responseText = { text: '', citations: [] };

    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('Copilot: timeout 60s'));
    }, 60000);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        event: 'setOptions',
        supportedFeatures: ['partial-generated-images'],
        supportedCards: ['weather', 'local', 'image', 'sports', 'video'],
        ads: { supportedTypes: ['text'] },
      }));
      ws.send(JSON.stringify({
        event: 'send',
        mode,
        conversationId,
        content: [{ type: 'text', text: prompt }],
        context: {},
      }));
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event === 'appendText') responseText.text += parsed.text || '';
        else if (parsed.event === 'citation') responseText.citations.push({ title: parsed.title, url: parsed.url });
        else if (parsed.event === 'done') {
          clearTimeout(timer);
          if (!responseText.text) return reject(new Error('Copilot: respons kosong'));
          resolve(responseText.text);
          ws.close();
        } else if (parsed.event === 'error') {
          clearTimeout(timer);
          reject(new Error('Copilot: ' + (parsed.message || JSON.stringify(parsed))));
          ws.close();
        }
      } catch { /* skip malformed frames */ }
    };

    ws.onerror = (e) => { clearTimeout(timer); reject(new Error('Copilot WS error')); };
  });
}

// ─── OpenRouter ──────────────────────────────────────────────────────
async function callOpenRouter(messages, model) {
  const key = Deno.env.get('OPENROUTER_API_KEY');
  if (!key) throw new Error('OPENROUTER_API_KEY belum dikonfigurasi');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'HTTP-Referer': 'https://kurocodex.ai',
      'X-Title': 'KuroCodex API',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 2000 }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('OpenRouter error: ' + response.status + ' - ' + err);
  }
  return response.json();
}

// ─── Model Status Check ──────────────────────────────────────────────
async function checkModelStatus(name, id) {
  try {
    if (name === 'claude') {
      const form = new FormData();
      form.append('chat_style', 'claudeai_0');
      form.append('chatHistory', JSON.stringify([{ role: 'user', content: 'hi' }]));
      form.append('model', 'standard');
      form.append('session_uuid', crypto.randomUUID());
      form.append('sensitivity_request_id', crypto.randomUUID());
      form.append('hacker_is_stinky', 'very_stinky');
      form.append('enabled_tools', JSON.stringify([]));
      const res = await fetch('https://api.deepai.org/hacking_is_a_serious_crime', {
        method: 'POST',
        headers: { 'api-key': 'tryit-61180926040-f45718959fea9f0a04999506c579a399', 'user-agent': randUA(), 'origin': 'https://deepai.org', 'referer': 'https://deepai.org/' },
        body: form,
        signal: AbortSignal.timeout(8000),
      });
      return res.ok ? 'active' : 'down';
    }

    if (name.startsWith('copilot')) {
      const res = await fetch('https://copilot.microsoft.com/c/api/conversations', {
        method: 'POST',
        headers: COPILOT_HEADERS,
        signal: AbortSignal.timeout(8000),
      });
      return res.ok ? 'active' : 'down';
    }

    // OpenRouter models
    const key = Deno.env.get('OPENROUTER_API_KEY');
    if (!key) return 'unknown';
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': 'Bearer ' + key },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return 'unknown';
    const data = await res.json();
    const found = data.data?.some(m => m.id === id);
    return found ? 'active' : 'down';
  } catch {
    return 'down';
  }
}

// ─── Main Handler ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const path = new URL(req.url).pathname;

  try {
    // GET /models - list models
    if (req.method === 'GET' && path.includes('/models')) {
      const checkStatus = new URL(req.url).searchParams.get('status') === 'true';

      const allModels = [
        ...Object.entries(FREE_MODELS).map(([name, id]) => ({ name, id, provider: id.split('/')[0], free: true, via: 'openrouter' })),
        { name: 'claude',       id: 'claude-via-deepai',   provider: 'anthropic', free: true, via: 'deepai' },
        { name: 'copilot',      id: 'copilot-chat',        provider: 'microsoft', free: true, via: 'copilot' },
        { name: 'copilot-think',id: 'copilot-reasoning',   provider: 'microsoft', free: true, via: 'copilot' },
        { name: 'copilot-smart',id: 'copilot-smart',       provider: 'microsoft', free: true, via: 'copilot' },
      ];

      if (checkStatus) {
        const withStatus = await Promise.all(
          allModels.map(async (m) => ({
            ...m,
            status: await checkModelStatus(m.name, m.id),
          }))
        );
        return new Response(JSON.stringify({ success: true, models: withStatus, total: withStatus.length }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, models: allModels, total: allModels.length }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /health
    if (req.method === 'GET' && path.includes('/health')) {
      return new Response(JSON.stringify({
        success: true, service: 'KuroCodex Chat API', status: 'healthy',
        models_available: Object.keys(FREE_MODELS).length + LOCAL_MODELS.length,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST /chat
    if (req.method === 'POST' && path.endsWith('/chat')) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ success: false, error: 'API key diperlukan' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const apiKey = authHeader.replace('Bearer ', '');
      const { data: user, error: userError } = await supabase
        .from('users').select('id, email, username, role, is_active')
        .eq('api_key', apiKey).maybeSingle();

      if (userError || !user) return new Response(JSON.stringify({ success: false, error: 'API key tidak valid' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (!user.is_active) return new Response(JSON.stringify({ success: false, error: 'Akun tidak aktif' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { messages, model = 'gemini' } = await req.json();
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Messages array diperlukan' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const isClaude  = model === 'claude';
      const isCopilot = model.startsWith('copilot');
      const modelId   = isClaude ? 'claude-via-deepai' : isCopilot ? `copilot-${COPILOT_MODELS[model] || 'chat'}` : (FREE_MODELS[model] || model);
      const start     = Date.now();

      try {
        let replyText = '';
        let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        if (isClaude) {
          replyText = await claudeChat(messages);
        } else if (isCopilot) {
          replyText = await copilotChat(messages, model);
        } else {
          const result = await callOpenRouter(messages, modelId);
          replyText = result.choices?.[0]?.message?.content || '';
          usage = { prompt_tokens: result.usage?.prompt_tokens || 0, completion_tokens: result.usage?.completion_tokens || 0, total_tokens: result.usage?.total_tokens || 0 };
        }

        await supabase.from('api_usage_logs').insert({ user_id: user.id, model: modelId, tokens_used: usage.total_tokens, status: 'success' });

        return new Response(JSON.stringify({
          success: true, model: modelId, message: replyText, usage,
          response_time: ((Date.now() - start) / 1000).toFixed(2) + 's',
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (error) {
        await supabase.from('api_usage_logs').insert({ user_id: user.id, model: modelId, tokens_used: 0, status: 'failed', error_message: error.message });
        throw error;
      }
    }

    return new Response(JSON.stringify({ success: false, error: 'Endpoint tidak ditemukan' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Terjadi kesalahan server' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
