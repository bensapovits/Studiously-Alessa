/*
  # Update Growth Stage Frequencies

  1. Changes
    - Drop existing stage constraint
    - Map existing time-based stages to new frequency stages
    - Add new stage constraint with updated valid stages
    
  2. Stage Mapping
    Old -> New
    - Added -> Monthly
    - 1 Month -> Monthly
    - 3 Months -> Quarterly
    - 5 Months -> Semiannual
    - 7 Months -> Semiannual
    - 10 Months -> Annual
    - 1 Year -> Annual

  3. Security
    - Maintains existing RLS policies
    - Preserves data integrity during migration
*/

DO $$ 
BEGIN
  -- First drop the existing constraint
  ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_stage_check;

  -- Now update the data
  UPDATE contacts 
  SET stage = 
    CASE stage
      WHEN 'Added' THEN 'Monthly'
      WHEN '1 Month' THEN 'Monthly'
      WHEN '3 Months' THEN 'Quarterly'
      WHEN '5 Months' THEN 'Semiannual'
      WHEN '7 Months' THEN 'Semiannual'
      WHEN '10 Months' THEN 'Annual'
      WHEN '1 Year' THEN 'Annual'
      ELSE stage
    END
  WHERE stage IN (
    'Added', '1 Month', '3 Months', '5 Months', 
    '7 Months', '10 Months', '1 Year'
  );

  -- Finally, add the new constraint
  ALTER TABLE contacts
    ADD CONSTRAINT contacts_stage_check 
    CHECK (stage IN (
      -- Connect stages remain unchanged
      'New',
      'Contacted', 
      'Meeting Booked',
      'Call Completed',
      'Follow Up',
      -- New frequency-based growth stages
      'Weekly',
      'Biweekly',
      'Monthly',
      'Quarterly',
      'Semiannual',
      'Annual'
    ));

  -- Update any remaining invalid stages to 'New'
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