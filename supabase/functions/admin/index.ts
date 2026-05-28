import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'kurocodex_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
    // Verify admin credentials
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Admin API key diperlukan'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiKey = authHeader.replace('Bearer ', '');

    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('id, email, username, role, is_active')
      .eq('api_key', apiKey)
      .eq('role', 'admin')
      .maybeSingle();

    if (adminError || !admin) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Akses ditolak. Admin diperlukan.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /admin/users - List all users
    if (req.method === 'GET' && path.includes('/users')) {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, username, role, api_key, is_active, created_at, last_login')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get usage stats for each user
      const usersWithStats = await Promise.all(users.map(async (user) => {
        const { count: totalRequests } = await supabase
          .from('api_usage_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { data: tokenData } = await supabase
          .from('api_usage_logs')
          .select('tokens_used')
          .eq('user_id', user.id);

        const totalTokens = tokenData?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0;

        return {
          ...user,
          total_requests: totalRequests || 0,
          total_tokens: totalTokens,
        };
      }));

      return new Response(JSON.stringify({
        success: true,
        users: usersWithStats,
        total: usersWithStats.length
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /admin/users/:id - Get single user
    if (req.method === 'GET' && path.match(/\/admin\/users\/[\w-]+$/)) {
      const userId = path.split('/').pop();

      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, username, role, api_key, is_active, created_at, last_login')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User tidak ditemukan'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get user's usage logs
      const { data: logs } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .order('request_time', { ascending: false })
        .limit(100);

      return new Response(JSON.stringify({
        success: true,
        user,
        logs: logs || []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /admin/users - Create new user
    if (req.method === 'POST' && path.includes('/users') && !path.match(/\/admin\/users\/[\w-]+$/)) {
      const { email, username, password, role } = await req.json();

      if (!email || !username || !password) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Email, username, dan password wajib diisi'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const passwordHash = await hashPassword(password);
      const newApiKey = generateApiKey();

      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email,
          username,
          password_hash: passwordHash,
          role: role || 'user',
          api_key: newApiKey,
        })
        .select('id, email, username, role, api_key, is_active, created_at')
        .single();

      if (error) {
        if (error.code === '23505') {
          return new Response(JSON.stringify({
            success: false,
            error: 'Email atau username sudah digunakan'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'User berhasil dibuat',
        user: newUser
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PUT /admin/users/:id - Update user
    if (req.method === 'PUT' && path.match(/\/admin\/users\/[\w-]+$/)) {
      const userId = path.split('/').pop();
      const updates = await req.json();

      const allowedUpdates = ['email', 'username', 'password', 'role', 'is_active'];
      const filteredUpdates: any = {};

      for (const [key, value] of Object.entries(updates)) {
        if (allowedUpdates.includes(key)) {
          if (key === 'password') {
            filteredUpdates.password_hash = await hashPassword(value as string);
          } else {
            filteredUpdates[key] = value;
          }
        }
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(filteredUpdates)
        .eq('id', userId)
        .select('id, email, username, role, api_key, is_active, created_at, last_login')
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          return new Response(JSON.stringify({
            success: false,
            error: 'Email atau username sudah digunakan'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        throw error;
      }

      if (!updatedUser) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User tidak ditemukan'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'User berhasil diupdate',
        user: updatedUser
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE /admin/users/:id - Delete user
    if (req.method === 'DELETE' && path.match(/\/admin\/users\/[\w-]+$/)) {
      const userId = path.split('/').pop();

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'User berhasil dihapus'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /admin/users/:id/regenerate-key - Regenerate API key
    if (req.method === 'POST' && path.includes('/regenerate-key')) {
      const parts = path.split('/');
      const userId = parts[parts.indexOf('users') + 1];

      const newApiKey = generateApiKey();

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ api_key: newApiKey })
        .eq('id', userId)
        .select('id, email, username, api_key')
        .maybeSingle();

      if (error) throw error;

      if (!updatedUser) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User tidak ditemukan'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'API key berhasil di-regenerate',
        api_key: updatedUser.api_key
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /admin/stats - Dashboard statistics
    if (req.method === 'GET' && path.includes('/stats')) {
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: totalRequests } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true });

      const { data: tokenData } = await supabase
        .from('api_usage_logs')
        .select('tokens_used');

      const totalTokens = tokenData?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0;

      const { data: recentLogs } = await supabase
        .from('api_usage_logs')
        .select('id, model, tokens_used, request_time, status, user_id')
        .order('request_time', { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({
        success: true,
        stats: {
          total_users: totalUsers || 0,
          active_users: activeUsers || 0,
          total_requests: totalRequests || 0,
          total_tokens: totalTokens,
        },
        recent_activity: recentLogs || []
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
    console.error('Admin error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Terjadi kesalahan server'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
