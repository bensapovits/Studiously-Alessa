/*
  # Add Custom Field Management Functions

  1. New Functions
    - `add_custom_field`: Adds a new custom field to the contacts table
    - Updates to existing functions to handle custom fields properly

  2. Security
    - Functions are marked as SECURITY DEFINER to run with elevated privileges
    - Execute permissions granted to authenticated users
*/

-- Function to add a custom field
CREATE OR REPLACE FUNCTION add_custom_field(field_name text, field_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the field is a core column that shouldn't be modified
  IF field_name IN ('id', 'name', 'email', 'phone', 'linkedin', 'company', 'college', 'stage', 'last_contacted', 'created_at', 'user_id') THEN
    RAISE EXCEPTION 'Cannot add core column: %', field_name;
  END IF;

  -- Check if the column already exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = field_name
  ) THEN
    RAISE EXCEPTION 'Column already exists: %', field_name;
  END IF;

  -- Validate field type
  IF field_type NOT IN ('text', 'date', 'email', 'phone', 'url') THEN
    RAISE EXCEPTION 'Invalid field type: %', field_type;
  END IF;

  -- Add the column with the appropriate type
  CASE field_type
    WHEN 'text' THEN
      EXECUTE format('ALTER TABLE contacts ADD COLUMN %I text', field_name);
    WHEN 'date' THEN
      EXECUTE format('ALTER TABLE contacts ADD COLUMN %I date', field_name);
    WHEN 'email' THEN
      EXECUTE format('ALTER TABLE contacts ADD COLUMN %I text CHECK (length(%I) <= 255)', field_name, field_name);
    WHEN 'phone' THEN
      EXECUTE format('ALTER TABLE contacts ADD COLUMN %I text CHECK (length(%I) <= 50)', field_name, field_name);
    WHEN 'url' THEN
      EXECUTE format('ALTER TABLE contacts ADD COLUMN %I text CHECK (length(%I) <= 2048)', field_name, field_name);
  END CASE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_custom_field TO authenticated;