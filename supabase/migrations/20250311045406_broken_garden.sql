/*
  # Add Custom Field Management Functions
  
  1. New Functions
    - check_column_exists: Checks if a column exists in a table
    - delete_custom_field: Safely removes a custom field column
    - rename_custom_field: Renames a custom field column
  
  2. Security
    - Functions are restricted to authenticated users
    - Core columns cannot be modified
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS check_column_exists(text, text);
DROP FUNCTION IF EXISTS delete_custom_field(text);
DROP FUNCTION IF EXISTS rename_custom_field(text, text);

-- Function to check if a column exists
CREATE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_column_exists TO authenticated;

-- Function to delete a custom field
CREATE FUNCTION delete_custom_field(field_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the field is a core column that shouldn't be deleted
  IF field_name IN ('id', 'name', 'email', 'phone', 'linkedin', 'company', 'college', 'stage', 'last_contacted', 'created_at', 'user_id') THEN
    RAISE EXCEPTION 'Cannot delete core column: %', field_name;
  END IF;

  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = field_name
  ) THEN
    RAISE EXCEPTION 'Column does not exist: %', field_name;
  END IF;

  -- Drop the column
  EXECUTE format('ALTER TABLE contacts DROP COLUMN IF EXISTS %I', field_name);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_custom_field TO authenticated;

-- Function to rename a custom field
CREATE FUNCTION rename_custom_field(old_name text, new_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the field is a core column that shouldn't be renamed
  IF old_name IN ('id', 'name', 'email', 'phone', 'linkedin', 'company', 'college', 'stage', 'last_contacted', 'created_at', 'user_id') THEN
    RAISE EXCEPTION 'Cannot rename core column: %', old_name;
  END IF;

  -- Check if the old column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = old_name
  ) THEN
    RAISE EXCEPTION 'Column does not exist: %', old_name;
  END IF;

  -- Check if the new column name already exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = new_name
  ) THEN
    RAISE EXCEPTION 'Column already exists: %', new_name;
  END IF;

  -- Rename the column
  EXECUTE format('ALTER TABLE contacts RENAME COLUMN %I TO %I', old_name, new_name);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION rename_custom_field TO authenticated;