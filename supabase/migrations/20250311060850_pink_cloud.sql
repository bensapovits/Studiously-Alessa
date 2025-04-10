/*
  # Add courses and assignments tables

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `color` (text)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
    - `assignments`
      - `id` (uuid, primary key)
      - `title` (text)
      - `due_date` (timestamp)
      - `course_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  due_date timestamptz NOT NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for courses
CREATE POLICY "Users can create their own courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses"
  ON courses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for assignments
CREATE POLICY "Users can create their own assignments"
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments"
  ON assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX courses_user_id_idx ON courses(user_id);
CREATE INDEX assignments_user_id_idx ON assignments(user_id);
CREATE INDEX assignments_course_id_idx ON assignments(course_id);
CREATE INDEX assignments_due_date_idx ON assignments(due_date);