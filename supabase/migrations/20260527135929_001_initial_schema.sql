/*
  # KuroCodex Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - User unique identifier
      - `email` (text, unique) - User email address
      - `username` (text, unique) - Username for login
      - `password_hash` (text) - Hashed password
      - `role` (text) - User role (admin/user)
      - `api_key` (text) - API key for API access
      - `is_active` (boolean) - Account status
      - `created_at` (timestamp) - Account creation date
      - `last_login` (timestamp) - Last login timestamp
    
    - `api_usage_logs`
      - `id` (uuid, primary key) - Log entry unique identifier
      - `user_id` (uuid) - Foreign key to users
      - `model` (text) - AI model used
      - `tokens_used` (integer) - Number of tokens consumed
      - `request_time` (timestamp) - When request was made
      - `status` (text) - Request status (success/failed)

  2. Security
    - Enable RLS on `users` table
    - Enable RLS on `api_usage_logs` table
    - Admin can manage all users
    - Users can view own data and logs
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  api_key text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- API Usage Logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  model text NOT NULL,
  tokens_used integer DEFAULT 0,
  request_time timestamptz DEFAULT now(),
  status text DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_message text
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- API Usage Logs policies
CREATE POLICY "Admins can view all logs"
  ON api_usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view own logs"
  ON api_usage_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own logs"
  ON api_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_api_key ON users(api_key);
CREATE INDEX idx_api_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_logs_request_time ON api_usage_logs(request_time);