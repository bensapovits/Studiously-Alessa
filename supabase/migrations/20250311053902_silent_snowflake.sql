/*
  # Create notes table for contact profiles

  1. New Tables
    - `notes` (if not exists)
      - `id` (uuid, primary key)
      - `content` (text)
      - `contact_id` (uuid, foreign key to contacts)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `notes` table
    - Add policies for authenticated users to manage their own notes
*/

-- Check if the table exists first
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content text NOT NULL,
    contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
  
  -- Enable RLS
  ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can create their own notes" ON notes;
  DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
  DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
  DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
END $$;

-- Create policies
CREATE POLICY "Users can create their own notes"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notes"
  ON notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;

-- Create trigger
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS notes_contact_id_idx ON notes(contact_id);
  CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
  CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;