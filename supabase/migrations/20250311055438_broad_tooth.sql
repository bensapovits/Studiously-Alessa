/*
  # Add emails table and relationships

  1. New Tables
    - `emails`
      - `id` (uuid, primary key)
      - `subject` (text)
      - `content` (text)
      - `sent_at` (timestamp)
      - `direction` (text) - 'incoming' or 'outgoing'
      - `contact_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `emails` table
    - Add policies for authenticated users to manage their emails
*/

CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  content text NOT NULL,
  sent_at timestamptz NOT NULL,
  direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS emails_contact_id_idx ON emails(contact_id);
CREATE INDEX IF NOT EXISTS emails_user_id_idx ON emails(user_id);
CREATE INDEX IF NOT EXISTS emails_sent_at_idx ON emails(sent_at);

-- Enable RLS
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own emails"
  ON emails
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own emails"
  ON emails
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own emails"
  ON emails
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emails"
  ON emails
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);