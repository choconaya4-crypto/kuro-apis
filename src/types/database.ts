export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  api_key: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  total_requests?: number;
  total_tokens?: number;
}

export interface ApiUsageLog {
  id: string;
  user_id: string;
  model: string;
  tokens_used: number;
  request_time: string;
  status: 'success' | 'failed';
  error_message?: string;
}

export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_requests: number;
  total_tokens: number;
}

export interface ChatResponse {
  success: boolean;
  model?: string;
  message?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
  response_time?: string;
}

export interface AIModel {
  name: string;
  id: string;
  provider: string;
  free: boolean;
}
