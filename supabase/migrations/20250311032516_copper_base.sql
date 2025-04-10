/*
  # Add contact_id to events table

  1. Changes
    - Add contact_id column to events table
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
    WHERE table_name = 'events' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE events ADD COLUMN contact_id uuid REFERENCES contacts(id);
    CREATE INDEX events_contact_id_idx ON events(contact_id);
  END IF;
END $$;