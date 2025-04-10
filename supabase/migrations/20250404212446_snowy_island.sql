/*
  # Add stage transition tracking and automation

  1. Changes
    - Add stage_entered_at column to contacts table
    - Create function to check and update stages
    - Create trigger to automatically update stages
    - Add function to calculate days since last contact

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity during migration
*/

-- Add stage_entered_at column
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS stage_entered_at timestamptz DEFAULT now();

-- Function to calculate days since last contact
CREATE OR REPLACE FUNCTION days_since_last_contact(last_contact_date timestamptz)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXTRACT(DAY FROM (now() - last_contact_date))::integer;
END;
$$;

-- Function to check and update contact stages
CREATE OR REPLACE FUNCTION check_and_update_stage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If contact is in "Contacted" stage for 5+ days with no response
  IF NEW.stage = 'Contacted' AND 
     days_since_last_contact(NEW.last_contacted) >= 5 THEN
    
    -- Move to "Follow Up" stage
    NEW.stage := 'Follow Up';
    NEW.stage_entered_at := now();
    
    -- Insert a note about the automatic transition
    INSERT INTO notes (
      content,
      contact_id,
      user_id,
      created_at,
      updated_at
    ) VALUES (
      format(
        'Automatically moved to Follow Up stage after %s days without response',
        days_since_last_contact(NEW.last_contacted)
      ),
      NEW.id,
      NEW.user_id,
      now(),
      now()
    );
  END IF;

  -- Update stage_entered_at when stage changes
  IF TG_OP = 'UPDATE' AND OLD.stage != NEW.stage THEN
    NEW.stage_entered_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for stage updates
DROP TRIGGER IF EXISTS contact_stage_check ON contacts;
CREATE TRIGGER contact_stage_check
  BEFORE INSERT OR UPDATE
  ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION check_and_update_stage();

-- Update existing contacts to set stage_entered_at
UPDATE contacts
SET stage_entered_at = CASE
  WHEN last_contacted IS NOT NULL THEN last_contacted
  ELSE created_at
END
WHERE stage_entered_at IS NULL;