/*
  # Update contact stages schema

  1. Changes
    - Add check constraint to contacts table for stage values
    - Update existing stage values to match new schema

  2. Stage Values
    Connect Stages:
      - New
      - Contacted
      - Meeting Booked
      - Call Completed
      - Follow Up
    
    Grow Stages:
      - Added
      - 1 Month
      - 3 Months
      - 5 Months
      - 7 Months
      - 10 Months
      - 1 Year
*/

DO $$ 
BEGIN
  -- Update existing stage values to 'New' to ensure consistency
  UPDATE contacts SET stage = 'New' WHERE stage = 'Initial Contact';

  -- Add check constraint for valid stage values
  ALTER TABLE contacts
    DROP CONSTRAINT IF EXISTS contacts_stage_check;
    
  ALTER TABLE contacts
    ADD CONSTRAINT contacts_stage_check
    CHECK (stage IN (
      'New', 'Contacted', 'Meeting Booked', 'Call Completed', 'Follow Up',
      'Added', '1 Month', '3 Months', '5 Months', '7 Months', '10 Months', '1 Year'
    ));
END $$;