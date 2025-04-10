/*
  # Create user integrations table

  1. New Tables
    - `user_integrations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `google_access_token` (text)
      - `google_refresh_token` (text)
      - `google_token_expiry` (timestamptz)
      - `google_last_sync` (timestamptz)
      - `linkedin_access_token` (text)
      - `linkedin_refresh_token` (text)
      - `linkedin_token_expiry` (timestamptz)
      - `linkedin_last_sync` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_integrations` table
    - Add policies for authenticated users to manage their own integrations
*/

-- Create user_integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  google_access_token text,
  google_refresh_token text,
  google_token_expiry timestamptz,
  google_last_sync timestamptz,
  linkedin_access_token text,
  linkedin_refresh_token text,
  linkedin_token_expiry timestamptz,
  linkedin_last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own integrations"
  ON user_integrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON user_integrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE
  ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();