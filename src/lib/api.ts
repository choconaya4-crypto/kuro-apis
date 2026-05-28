import { SUPABASE_URL } from './supabase';
import { getIdToken } from './firebase';
import type { User, DashboardStats, ApiUsageLog, ChatResponse, AIModel } from '../types/database';

// Use proxy endpoints for security
const PROXY_URL = `${SUPABASE_URL}/functions/v1/proxy`;

// Get headers with Firebase token
async function getAuthHeaders(): Promise<Record<string, string>> {
  const idToken = await getIdToken();
  return {
    'Content-Type': 'application/json',
    'X-Firebase-Token': idToken || '',
  };
}

// Legacy API key headers (for backward compatibility)
const getApiKeyHeaders = (apiKey: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`,
});

// Auth API (Firebase)
export async function firebaseAuth(idToken: string, email: string, uid: string, displayName?: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(`${PROXY_URL}/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, email, uid, displayName }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// Chat API (via proxy with Firebase auth)
export async function getModels(): Promise<{ success: boolean; models?: AIModel[]; error?: string }> {
  try {
    const response = await fetch(`${PROXY_URL}/chat/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function sendMessage(messages: any[], model: string): Promise<ChatResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${PROXY_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, model }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// Admin API (via proxy with Firebase auth)
export async function getAdminStats(): Promise<{ success: boolean; stats?: DashboardStats; recent_activity?: ApiUsageLog[]; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${PROXY_URL}/admin/stats`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function getAllUsers(): Promise<{ success: boolean; users?: User[]; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${PROXY_URL}/admin/users`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function getUserDetails(userId: string): Promise<{ success: boolean; user?: User; logs?: ApiUsageLog[]; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${PROXY_URL}/admin/users/${userId}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function createUser(email: string, username: string, password: string, role: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${PROXY_URL}/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, username, password, role }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function updateUser(userId: string, updates: Partial<User> & { password?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${PROXY_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${PROXY_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function regenerateApiKey(userId: string): Promise<{ success: boolean; api_key?: string; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${PROXY_URL}/admin/users/${userId}/regenerate-key`, {
      method: 'POST',
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
