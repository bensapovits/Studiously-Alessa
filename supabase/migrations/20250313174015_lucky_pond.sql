/*
  # Update contacts stage constraint

  1. Changes
    - Update the stage check constraint to include all valid stages
    - Ensure existing data remains valid
    - Maintain data integrity during the update

  2. Notes
    - All stages must match the application's valid stages
    - Preserves existing stage values
*/

DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_stage_check;
  
  -- Add updated constraint with all valid stages
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

  -- Update any invalid stages to 'New'
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