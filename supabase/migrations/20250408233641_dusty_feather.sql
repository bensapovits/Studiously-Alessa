/*
  # Add task status management
  
  1. Changes
    - Add status column to tasks table
    - Add check constraint for valid status values
    - Update existing tasks based on completed flag
    - Ensure all tasks have a valid status
*/

-- Add status column if it doesn't exist
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Not Started';

-- Add check constraint for valid status values
DO $$ 
BEGIN
  ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS tasks_status_check;
    
  ALTER TABLE tasks
    ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('Not Started', 'In Progress', 'Completed'));
END $$;

-- Update existing tasks without a status
UPDATE tasks
SET status = CASE
  WHEN completed THEN 'Completed'
  ELSE 'Not Started'
END
WHERE status NOT IN ('Not Started', 'In Progress', 'Completed');