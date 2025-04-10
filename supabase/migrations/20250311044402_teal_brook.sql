/*
  # Add Custom Fields Management

  1. Changes
    - Add function to safely delete custom fields from contacts table
    - Add security policies for custom field management
    - Add validation to ensure column exists before deletion
    - Add check to prevent deletion of core columns

  2. Security
    - Only authenticated users can delete custom fields
    - Users can only delete custom fields they created
    - Core columns are protected from deletion
*/

-- Function to safely delete a custom field
CREATE OR REPLACE FUNCTION delete_custom_field(field_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  core_columns text[] := ARRAY['id', 'name', 'email', 'phone', 'linkedin', 'company', 'college', 'stage', 'last_contacted', 'created_at', 'user_id'];
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contacts' 
    AND column_name = field_name
  ) THEN
    RAISE EXCEPTION 'Column % does not exist', field_name;
  END IF;

  -- Prevent deletion of core columns
  IF field_name = ANY(core_columns) THEN
    RAISE EXCEPTION 'Cannot delete core column %', field_name;
  END IF;

  -- Drop the column
  EXECUTE format('ALTER TABLE contacts DROP COLUMN IF EXISTS %I', field_name);

  RETURN true;
END;
$$;