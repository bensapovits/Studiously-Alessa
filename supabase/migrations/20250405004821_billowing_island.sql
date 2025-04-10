/*
  # Fix contacts table constraints and triggers

  1. Changes
    - Update stage constraint to match valid stages
    - Add NOT NULL constraints for required fields
    - Update existing records to ensure data consistency
    - Add trigger to maintain full name from first/last name

  2. Security
    - Maintain existing RLS policies
    - Preserve data integrity
*/

-- First ensure all existing records have valid first/last names
UPDATE contacts
SET 
  first_name = COALESCE(first_name, split_part(name, ' ', 1)),
  last_name = COALESCE(
    last_name,
    CASE 
      WHEN position(' ' IN name) > 0 THEN substring(name FROM position(' ' IN name) + 1)
      ELSE 'Unknown'
    END
  )
WHERE first_name IS NULL OR last_name IS NULL;

-- Update stage values to ensure they're valid
UPDATE contacts
SET stage = 'New'
WHERE stage NOT IN (
  'New',
  'Contacted',
  'Meeting Booked',
  'Call Completed',
  'Follow Up',
  'Weekly',
  'Biweekly',
  'Monthly',
  'Quarterly',
  'Semiannual',
  'Annual'
);

-- Add/update constraints
ALTER TABLE contacts
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL,
  DROP CONSTRAINT IF EXISTS contacts_stage_check;

ALTER TABLE contacts
  ADD CONSTRAINT contacts_stage_check 
  CHECK (stage IN (
    'New',
    'Contacted',
    'Meeting Booked',
    'Call Completed',
    'Follow Up',
    'Weekly',
    'Biweekly',
    'Monthly',
    'Quarterly',
    'Semiannual',
    'Annual'
  ));

-- Function to update full name
CREATE OR REPLACE FUNCTION update_contact_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name = TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger
DROP TRIGGER IF EXISTS update_contact_name ON contacts;
CREATE TRIGGER update_contact_name
  BEFORE INSERT OR UPDATE OF first_name, last_name
  ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_full_name();