/*
  # Update follow-ups table schema

  1. Changes
    - Safely check if table exists before creating
    - Add missing indexes if needed
    - Ensure RLS and policies are properly set
    - Add triggers if missing

  2. Security
    - Maintain RLS policies
    - Preserve existing data
*/

-- Safely create or update follow_ups table
DO $$ 
BEGIN
  -- Check if table needs to be created
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follow_ups') THEN
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
  END IF;

  -- Ensure RLS is enabled
  ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

  -- Create policies if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_ups' AND policyname = 'Users can create their own follow-ups') THEN
    CREATE POLICY "Users can create their own follow-ups"
      ON follow_ups
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_ups' AND policyname = 'Users can view their own follow-ups') THEN
    CREATE POLICY "Users can view their own follow-ups"
      ON follow_ups
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_ups' AND policyname = 'Users can update their own follow-ups') THEN
    CREATE POLICY "Users can update their own follow-ups"
      ON follow_ups
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_ups' AND policyname = 'Users can delete their own follow-ups') THEN
    CREATE POLICY "Users can delete their own follow-ups"
      ON follow_ups
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Create indexes if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'follow_ups' AND indexname = 'follow_ups_contact_id_idx') THEN
    CREATE INDEX follow_ups_contact_id_idx ON follow_ups(contact_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'follow_ups' AND indexname = 'follow_ups_user_id_idx') THEN
    CREATE INDEX follow_ups_user_id_idx ON follow_ups(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'follow_ups' AND indexname = 'follow_ups_next_due_date_idx') THEN
    CREATE INDEX follow_ups_next_due_date_idx ON follow_ups(next_due_date);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'follow_ups' AND indexname = 'follow_ups_frequency_idx') THEN
    CREATE INDEX follow_ups_frequency_idx ON follow_ups(frequency);
  END IF;

  -- Create trigger if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_follow_ups_updated_at') THEN
    CREATE TRIGGER update_follow_ups_updated_at
      BEFORE UPDATE ON follow_ups
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;