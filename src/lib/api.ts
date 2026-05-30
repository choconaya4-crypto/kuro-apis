import { getAuth } from 'firebase/auth';

const SUPABASE_PROXY = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/proxy';

async function getFirebaseToken(): Promise<string | null> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = await getFirebaseToken();

  const response = await fetch(`${SUPABASE_PROXY}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Firebase-Token': token } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `API Error: ${response.status}`);
  return data;
}

// ── Admin ────────────────────────────────────────────────────────────
export async function getAdminStats() {
  return apiCall('/admin/stats');
}

export async function getAllUsers() {
  return apiCall('/admin/users');
}

export async function createUser(email: string, username: string, password: string, role = 'user') {
  return apiCall('/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, username, password, role }),
  });
}

export async function updateUser(userId: string, updates: Record<string, any>) {
  return apiCall(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteUser(userId: string) {
  return apiCall(`/admin/users/${userId}`, { method: 'DELETE' });
}

export async function regenerateApiKey(userId: string) {
  return apiCall(`/admin/users/${userId}/regenerate-key`, { method: 'POST' });
}

// ── Models ───────────────────────────────────────────────────────────
export async function getModels(queryParam = '') {
  // Models endpoint is public (no auth needed)
  const url = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/chat/models' + queryParam;
  const response = await fetch(url);
  return response.json();
}

// ── Chat ─────────────────────────────────────────────────────────────
export async function sendMessage(messages: { role: string; content: string }[], model = 'gemini') {
  return apiCall('/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, model }),
  });
}

// ── Logs ─────────────────────────────────────────────────────────────
export async function getActivityLogs(limit = 50) {
  return apiCall(`/admin/activity?limit=${limit}`);
}
