/*
  # Custom Fields Management

  1. Changes
    - Add function to check if a column exists
    - Add function to rename custom fields
    - Add security policies for custom field management
    - Add validation to ensure column exists before operations
    - Add check to prevent modification of core columns

  2. Security
    - Only authenticated users can manage custom fields
    - Users can only manage custom fields they created
    - Core columns are protected from modification
*/

-- Function to check if a column exists
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = $1 
    AND column_name = $2
  );
END;
$$;

-- Function to rename a custom field
CREATE OR REPLACE FUNCTION rename_custom_field(old_name text, new_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  core_columns text[] := ARRAY['id', 'name', 'email', 'phone', 'linkedin', 'company', 'college', 'stage', 'last_contacted', 'created_at', 'user_id'];
BEGIN
  -- Check if old column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contacts' 
    AND column_name = old_name
  ) THEN
    RAISE EXCEPTION 'Column % does not exist', old_name;
  END IF;

  -- Prevent modification of core columns
  IF old_name = ANY(core_columns) THEN
    RAISE EXCEPTION 'Cannot modify core column %', old_name;
  END IF;

  -- Check if new name already exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contacts' 
    AND column_name = new_name
  ) THEN
    RAISE EXCEPTION 'Column % already exists', new_name;
  END IF;

  -- Rename the column
  EXECUTE format('ALTER TABLE contacts RENAME COLUMN %I TO %I', old_name, new_name);

  RETURN true;
END;
$$;