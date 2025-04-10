/*
  # Update contacts stage constraint

  1. Changes
    - Update the stage check constraint to match the valid stages used in the application
    - Set default stage to 'New' for consistency

  2. Notes
    - Using DO block to safely modify constraint
    - Ensuring data consistency with valid stage values
*/

DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_stage_check;
  
  -- Add updated constraint with correct stage values
  ALTER TABLE contacts
    ADD CONSTRAINT contacts_stage_check 
    CHECK (stage IN (
      'New',
      'Contacted',
      'Meeting Booked',
      'Call Completed',
      'Follow Up',
      'Added',
      '1 Month',
      '3 Months',
      '5 Months',
      '7 Months',
      '10 Months',
      '1 Year'
    ));

  -- Update default value for stage
  ALTER TABLE contacts 
    ALTER COLUMN stage SET DEFAULT 'New';

  -- Update any existing records with invalid stages to 'New'
  UPDATE contacts 
  SET stage = 'New' 
  WHERE stage NOT IN (
    'New',
    'Contacted',
    'Meeting Booked',
    'Call Completed',
    'Follow Up',
    'Added',
    '1 Month',
    '3 Months',
    '5 Months',
    '7 Months',
    '10 Months',
    '1 Year'
  );
END $$;