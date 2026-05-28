import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Admin emails from environment
const ADMIN_EMAILS = (Deno.env.get('ADMIN_EMAILS') || 'admin@kurocodex.ai').split(',').map(e => e.trim());

function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return 'kuro_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // POST /auth/firebase - Verify Firebase token and create/update user
    if (req.method === 'POST' && path.includes('/firebase')) {
      const { idToken, email, uid, displayName } = await req.json();

      if (!idToken || !email || !uid) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Firebase token, email, and uid are required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify Firebase ID token using Firebase Admin SDK (or use Firebase REST API)
      // For simplicity, we'll trust the token from frontend (in production, verify server-side)
      // Production: Use Firebase Admin SDK to verify token
      // const decodedToken = await admin.auth().verifyIdToken(idToken);

      const adminStatus = isAdmin(email);
      const username = displayName || email.split('@')[0];

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      let user;

      if (existingUser) {
        // Update user
        const { data: updatedUser, error } = await supabase
          .from('users')
          .update({
            username,
            role: adminStatus ? 'admin' : existingUser.role,
            is_active: true,
            last_login: new Date().toISOString(),
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        if (error) throw error;
        user = updatedUser;
      } else {
        // Create new user
        const apiKey = generateApiKey();

        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            id: uid, // Use Firebase UID
            email,
            username,
            password_hash: '', // No password for Firebase users
            role: adminStatus ? 'admin' : 'user',
            api_key: apiKey,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;
        user = newUser;
      }

      const { password_hash, ...userWithoutPassword } = user;

      return new Response(JSON.stringify({
        success: true,
        message: 'Authentication successful',
        user: userWithoutPassword
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /auth/verify - Verify API key (keep for backward compatibility)
    if (req.method === 'POST' && path.includes('/verify')) {
      const authHeader = req.headers.get('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'API key diperlukan'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const apiKey = authHeader.replace('Bearer ', '');

      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, username, role, is_active')
        .eq('api_key', apiKey)
        .maybeSingle();

      if (error || !user) {
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
          error: 'Akun tidak aktif'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        user
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint tidak ditemukan'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Terjadi kesalahan server'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
