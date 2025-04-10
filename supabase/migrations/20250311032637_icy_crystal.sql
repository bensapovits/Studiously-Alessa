/*
  # Add contact_id to tasks table

  1. Changes
    - Add contact_id column to tasks table
    - Add foreign key constraint to contacts table
    - Add index on contact_id for better query performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add contact_id column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN contact_id uuid REFERENCES contacts(id);
    CREATE INDEX tasks_contact_id_idx ON tasks(contact_id);
  END IF;
END $$;