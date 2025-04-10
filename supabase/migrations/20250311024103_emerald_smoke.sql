/*
  # Create tasks table and policies

  1. New Tables
    - `tasks` (if not exists)
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `project` (text)
      - `priority` (text) - low, medium, high
      - `due_date` (timestamptz)
      - `completed` (boolean, default false)
      - `created_at` (timestamptz)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `tasks` table
    - Add policies for CRUD operations
*/

-- Create tasks table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'tasks'
  ) THEN
    CREATE TABLE tasks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text,
      project text,
      priority text CHECK (priority IN ('low', 'medium', 'high')),
      due_date timestamptz,
      completed boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      user_id uuid NOT NULL REFERENCES auth.users(id)
    );
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'tasks' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' 
    AND policyname = 'Users can create their own tasks'
  ) THEN
    CREATE POLICY "Users can create their own tasks"
      ON tasks
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' 
    AND policyname = 'Users can view their own tasks'
  ) THEN
    CREATE POLICY "Users can view their own tasks"
      ON tasks
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' 
    AND policyname = 'Users can update their own tasks'
  ) THEN
    CREATE POLICY "Users can update their own tasks"
      ON tasks
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' 
    AND policyname = 'Users can delete their own tasks'
  ) THEN
    CREATE POLICY "Users can delete their own tasks"
      ON tasks
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'tasks' 
    AND indexname = 'tasks_user_id_idx'
  ) THEN
    CREATE INDEX tasks_user_id_idx ON tasks(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'tasks' 
    AND indexname = 'tasks_due_date_idx'
  ) THEN
    CREATE INDEX tasks_due_date_idx ON tasks(due_date);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'tasks' 
    AND indexname = 'tasks_project_idx'
  ) THEN
    CREATE INDEX tasks_project_idx ON tasks(project);
  END IF;
END $$;