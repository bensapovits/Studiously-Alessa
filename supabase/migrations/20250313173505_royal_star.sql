/*
  # Add follow-up management schema

  1. New Tables
    - `follow_ups`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, references contacts)
      - `user_id` (uuid, references auth.users)
      - `frequency` (text) - weekly, biweekly, monthly, quarterly, semiannual, annual
      - `next_due_date` (timestamptz)
      - `last_completed` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `status` (text) - pending, completed, snoozed
      - `snooze_until` (timestamptz)
      - `notes` (text)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create follow_ups table
CREATE TABLE follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual')),
  next_due_date timestamptz NOT NULL,
  last_completed timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'snoozed')),
  snooze_until timestamptz,
  notes text,
  UNIQUE(contact_id) -- One active follow-up per contact
);

-- Enable RLS
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own follow-ups"
  ON follow_ups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own follow-ups"
  ON follow_ups
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own follow-ups"
  ON follow_ups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follow-ups"
  ON follow_ups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX follow_ups_contact_id_idx ON follow_ups(contact_id);
CREATE INDEX follow_ups_user_id_idx ON follow_ups(user_id);
CREATE INDEX follow_ups_next_due_date_idx ON follow_ups(next_due_date);
CREATE INDEX follow_ups_frequency_idx ON follow_ups(frequency);

-- Create updated_at trigger
CREATE TRIGGER update_follow_ups_updated_at
  BEFORE UPDATE ON follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();