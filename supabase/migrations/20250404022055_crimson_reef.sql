/*
  # Add Custom Field Management Functions

  1. New Functions
    - add_custom_field: Adds a new custom field to contacts table
    - check_column_exists: Checks if a column exists
    - get_column_type: Gets the SQL type for a given field type

  2. Security
    - Functions are restricted to authenticated users
    - Core columns cannot be modified
    - Field names are sanitized
*/

-- Function to get the appropriate SQL type for a field type
CREATE OR REPLACE FUNCTION get_column_type(field_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN CASE field_type
    WHEN 'text' THEN 'text'
    WHEN 'number' THEN 'numeric'
    WHEN 'date' THEN 'date'
    WHEN 'email' THEN 'text'
    WHEN 'phone' THEN 'text'
    WHEN 'url' THEN 'text'
    ELSE 'text'
  END;
END;
$$;

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
    WHERE table_schema = 'public'
      AND table_name = $1 
      AND column_name = $2
  );
END;
$$;

-- Function to add a custom field
CREATE OR REPLACE FUNCTION add_custom_field(field_name text, field_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  core_columns text[] := ARRAY[
    'id', 'name', 'email', 'phone', 'linkedin', 'company', 
    'college', 'stage', 'last_contacted', 'created_at', 'user_id',
    'first_name', 'last_name'
  ];
  sql_type text;
  sanitized_name text;
BEGIN
  -- Check if field name is provided
  IF field_name IS NULL OR field_name = '' THEN
    RAISE EXCEPTION 'Field name is required';
  END IF;

  -- Sanitize field name (remove special characters, convert to snake_case)
  sanitized_name := regexp_replace(
    regexp_replace(lower(field_name), '[^a-z0-9\s]', '', 'g'),
    '\s+', '_', 'g'
  );

  -- Check if field name is a core column
  IF sanitized_name = ANY(core_columns) THEN
    RAISE EXCEPTION 'Cannot add core column: %', sanitized_name;
  END IF;

  -- Check if column already exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = sanitized_name
  ) THEN
    RAISE EXCEPTION 'Column already exists: %', sanitized_name;
  END IF;

  -- Get SQL type for the field
  sql_type := get_column_type(field_type);

  -- Add constraints based on field type
  CASE field_type
    WHEN 'email' THEN
      EXECUTE format(
        'ALTER TABLE contacts ADD COLUMN %I %s CHECK (length(%I) <= 255)',
        sanitized_name, sql_type, sanitized_name
      );
    WHEN 'phone' THEN
      EXECUTE format(
        'ALTER TABLE contacts ADD COLUMN %I %s CHECK (length(%I) <= 50)',
        sanitized_name, sql_type, sanitized_name
      );
    WHEN 'url' THEN
      EXECUTE format(
        'ALTER TABLE contacts ADD COLUMN %I %s CHECK (length(%I) <= 2048)',
        sanitized_name, sql_type, sanitized_name
      );
    ELSE
      EXECUTE format(
        'ALTER TABLE contacts ADD COLUMN %I %s',
        sanitized_name, sql_type
      );
  END CASE;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_column_type(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_column_exists(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_custom_field(text, text) TO authenticated;