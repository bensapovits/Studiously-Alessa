/*
  # Fix stage validation constraint

  1. Changes
    - Drop existing stage constraint
    - Add updated constraint with correct stage values
    - Update any existing records to valid stages
    - Ensure all stage values match frontend constants

  2. Security
    - Maintain existing RLS policies
    - Preserve data integrity during migration
*/

DO $$ 
BEGIN
  -- Drop existing constraint
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
      'Weekly',
      'Biweekly',
      'Monthly',
      'Quarterly',
      'Semiannual',
      'Annual'
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
    'Weekly',
    'Biweekly',
    'Monthly',
    'Quarterly',
    'Semiannual',
    'Annual'
  );
END $$;