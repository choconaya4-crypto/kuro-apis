import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Firebase-Token",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Rate limiting using in-memory store (resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
  };
}

// Admin emails from environment
const ADMIN_EMAILS = (Deno.env.get('ADMIN_EMAILS') || 'admin@kurocodex.ai').split(',').map(e => e.trim());

function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const path = url.pathname;
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Check rate limit
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Rate limit exceeded. Try again later.'
    }), {
      status: 429,
      headers: {
        ...corsHeaders,
        ...getSecurityHeaders(),
        'Content-Type': 'application/json',
        'Retry-After': '60'
      }
    });
  }

  try {
    // Proxy to auth function (Firebase authentication)
    if (path.includes('/proxy/auth')) {
      const authPath = path.replace('/proxy/auth', '');

      // For Firebase auth, pass through the request as-is
      const response = await fetch(`${supabaseUrl}/functions/v1/auth${authPath}`, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: req.method !== 'GET' ? await req.text() : undefined,
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          ...corsHeaders,
          ...getSecurityHeaders(),
          'Content-Type': 'application/json',
        }
      });
    }

    // Helper to verify Firebase user and get/create user in database
    async function verifyFirebaseUser(firebaseToken: string, email: string, uid: string) {
      // Check if user exists by email
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      // If user doesn't exist, create via auth/firebase endpoint
      if (!user) {
        const createResponse = await fetch(`${supabaseUrl}/functions/v1/auth/firebase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: firebaseToken,
            email,
            uid,
            displayName: email.split('@')[0]
          })
        });

        const createData = await createResponse.json();
        return createData.success ? createData.user : null;
      }

      return user;
    }

    // Proxy to chat function with Firebase authentication
    if (path.includes('/proxy/chat')) {
      const authHeader = req.headers.get('Authorization');
      const firebaseToken = req.headers.get('X-Firebase-Token');

      if (!authHeader && !firebaseToken) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authorization header or X-Firebase-Token required'
        }), {
          status: 401,
          headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
        });
      }

      let user;

      // If using Firebase token
      if (firebaseToken) {
        // Extract user info from Firebase token (in production, verify token server-side)
        // For now, we'll parse the JWT (unverified - only for development)
        try {
          const payload = JSON.parse(atob(firebaseToken.split('.')[1]));
          user = await verifyFirebaseUser(firebaseToken, payload.email, payload.user_id || payload.sub);
        } catch (e) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid Firebase token'
          }), {
            status: 401,
            headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
          });
        }
      } else {
        // Legacy API key authentication
        const apiKey = authHeader!.replace('Bearer ', '');
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('api_key', apiKey)
          .maybeSingle();

        user = data;
        if (error || !user) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid API key'
          }), {
            status: 401,
            headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
          });
        }
      }

      if (!user || !user.is_active) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Account not found or inactive'
        }), {
          status: 403,
          headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
        });
      }

      const chatPath = path.replace('/proxy/chat', '');

      const response = await fetch(`${supabaseUrl}/functions/v1/chat${chatPath}`, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.api_key}`,
        },
        body: req.method !== 'GET' ? await req.text() : undefined,
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          ...corsHeaders,
          ...getSecurityHeaders(),
          'Content-Type': 'application/json',
        }
      });
    }

    // Proxy to admin function with admin role verification
    if (path.includes('/proxy/admin')) {
      const authHeader = req.headers.get('Authorization');
      const firebaseToken = req.headers.get('X-Firebase-Token');

      if (!authHeader && !firebaseToken) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Admin authentication required'
        }), {
          status: 401,
          headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
        });
      }

      let admin;

      // If using Firebase token
      if (firebaseToken) {
        try {
          const payload = JSON.parse(atob(firebaseToken.split('.')[1]));
          const email = payload.email;

          if (!isAdmin(email)) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Admin access required'
            }), {
              status: 403,
              headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
            });
          }

          admin = await verifyFirebaseUser(firebaseToken, email, payload.user_id || payload.sub);
        } catch (e) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid Firebase token'
          }), {
            status: 401,
            headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
          });
        }
      } else {
        // Legacy API key authentication
        const apiKey = authHeader!.replace('Bearer ', '');
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('api_key', apiKey)
          .eq('role', 'admin')
          .maybeSingle();

        admin = data;
        if (error || !admin) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Admin access required'
          }), {
            status: 403,
            headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
          });
        }
      }

      if (!admin || !admin.is_active) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Admin account not found or inactive'
        }), {
          status: 403,
          headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
        });
      }

      const adminPath = path.replace('/proxy/admin', '');

      const response = await fetch(`${supabaseUrl}/functions/v1/admin${adminPath}`, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${admin.api_key}`,
        },
        body: req.method !== 'GET' ? await req.text() : undefined,
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          ...corsHeaders,
          ...getSecurityHeaders(),
          'Content-Type': 'application/json',
        }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid proxy endpoint. Use: /proxy/auth, /proxy/chat, /proxy/admin'
    }), {
      status: 404,
      headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
    });
  }
});
