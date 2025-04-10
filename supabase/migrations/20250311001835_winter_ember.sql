/*
  # Create contacts table and security policies

  1. New Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `linkedin` (text)
      - `company` (text)
      - `college` (text)
      - `stage` (text)
      - `last_contacted` (timestamptz)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `contacts` table
    - Add policies for authenticated users to:
      - Read their own contacts
      - Create new contacts
      - Update their own contacts
      - Delete their own contacts
*/

-- Create contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  linkedin text,
  company text,
  college text,
  stage text DEFAULT 'Initial Contact',
  last_contacted timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
  DROP POLICY IF EXISTS "Users can create contacts" ON contacts;
  DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
  DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;
END $$;

-- Create policies
CREATE POLICY "Users can view their own contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON contacts(user_id);
CREATE INDEX IF NOT EXISTS contacts_name_idx ON contacts(name);
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);
CREATE INDEX IF NOT EXISTS contacts_company_idx ON contacts(company);