/*
  # Add first and last name fields to contacts table

  1. Changes
    - Add first_name and last_name columns to contacts table
    - Split existing name field into first_name and last_name
    - Keep name column for full name display
    - Add trigger to automatically update full name when first or last name changes

  2. Notes
    - Maintains backward compatibility with existing name field
    - Ensures data consistency through trigger
*/

-- Add new columns
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Split existing names into first and last name
DO $$
BEGIN
  UPDATE contacts
  SET 
    first_name = SPLIT_PART(name, ' ', 1),
    last_name = SUBSTRING(name FROM POSITION(' ' IN name) + 1);
END $$;

-- Create function to update full name
CREATE OR REPLACE FUNCTION update_contact_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name = TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain full name
DROP TRIGGER IF EXISTS update_contact_name ON contacts;
CREATE TRIGGER update_contact_name
  BEFORE INSERT OR UPDATE OF first_name, last_name
  ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_full_name();

-- Make first_name and last_name required
ALTER TABLE contacts
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;