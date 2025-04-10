/*
  # Add status column to tasks table

  1. Changes
    - Add status column to tasks table
    - Set default value to 'Not Started'
    - Add check constraint for valid status values
    - Update existing tasks to have status 'Not Started'

  2. Security
    - Maintain existing RLS policies
    - Preserve data integrity during migration
*/

-- Add status column if it doesn't exist
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Not Started';

-- Add check constraint for valid status values
ALTER TABLE tasks
ADD CONSTRAINT tasks_status_check
CHECK (status IN ('Not Started', 'In Progress', 'Completed'));

-- Update existing tasks without a status
UPDATE tasks
SET status = CASE
  WHEN completed THEN 'Completed'
  ELSE 'Not Started'
END
WHERE status IS NULL;