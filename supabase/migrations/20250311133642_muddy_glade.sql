/*
  # Database Schema Update
  
  1. Changes
    - Add IF NOT EXISTS to all CREATE statements
    - Add DO blocks to safely create indexes
    - Handle existing tables and indexes gracefully
  
  2. Security
    - Ensure RLS policies are properly applied
    - Maintain all necessary constraints and checks
*/

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Safely create indexes using DO blocks
DO $$
BEGIN
    -- Contacts indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'contacts_user_id_idx') THEN
        CREATE INDEX contacts_user_id_idx ON contacts(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'contacts_name_idx') THEN
        CREATE INDEX contacts_name_idx ON contacts(name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'contacts_email_idx') THEN
        CREATE INDEX contacts_email_idx ON contacts(email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'contacts_company_idx') THEN
        CREATE INDEX contacts_company_idx ON contacts(company);
    END IF;

    -- Projects index
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'projects_user_id_idx') THEN
        CREATE INDEX projects_user_id_idx ON projects(user_id);
    END IF;

    -- Tasks indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tasks_user_id_idx') THEN
        CREATE INDEX tasks_user_id_idx ON tasks(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tasks_project_idx') THEN
        CREATE INDEX tasks_project_idx ON tasks(project_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tasks_due_date_idx') THEN
        CREATE INDEX tasks_due_date_idx ON tasks(due_date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tasks_contact_id_idx') THEN
        CREATE INDEX tasks_contact_id_idx ON tasks(contact_id);
    END IF;

    -- Events indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'events_user_id_idx') THEN
        CREATE INDEX events_user_id_idx ON events(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'events_start_time_idx') THEN
        CREATE INDEX events_start_time_idx ON events(start_time);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'events_type_idx') THEN
        CREATE INDEX events_type_idx ON events(type);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'events_contact_id_idx') THEN
        CREATE INDEX events_contact_id_idx ON events(contact_id);
    END IF;

    -- Notes indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'notes_contact_id_idx') THEN
        CREATE INDEX notes_contact_id_idx ON notes(contact_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'notes_user_id_idx') THEN
        CREATE INDEX notes_user_id_idx ON notes(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'notes_updated_at_idx') THEN
        CREATE INDEX notes_updated_at_idx ON notes(updated_at);
    END IF;

    -- Emails indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'emails_contact_id_idx') THEN
        CREATE INDEX emails_contact_id_idx ON emails(contact_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'emails_user_id_idx') THEN
        CREATE INDEX emails_user_id_idx ON emails(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'emails_sent_at_idx') THEN
        CREATE INDEX emails_sent_at_idx ON emails(sent_at);
    END IF;

    -- Courses index
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'courses_user_id_idx') THEN
        CREATE INDEX courses_user_id_idx ON courses(user_id);
    END IF;

    -- Assignments indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'assignments_course_id_idx') THEN
        CREATE INDEX assignments_course_id_idx ON assignments(course_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'assignments_user_id_idx') THEN
        CREATE INDEX assignments_user_id_idx ON assignments(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'assignments_due_date_idx') THEN
        CREATE INDEX assignments_due_date_idx ON assignments(due_date);
    END IF;
END $$;

-- Enable RLS and create policies for all tables
DO $$
BEGIN
    -- Contacts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
        ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Users can create contacts') THEN
            CREATE POLICY "Users can create contacts" ON contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Users can view their own contacts') THEN
            CREATE POLICY "Users can view their own contacts" ON contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Users can update their own contacts') THEN
            CREATE POLICY "Users can update their own contacts" ON contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Users can delete their own contacts') THEN
            CREATE POLICY "Users can delete their own contacts" ON contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- Projects
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can create their own projects') THEN
            CREATE POLICY "Users can create their own projects" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view their own projects') THEN
            CREATE POLICY "Users can view their own projects" ON projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can update their own projects') THEN
            CREATE POLICY "Users can update their own projects" ON projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can delete their own projects') THEN
            CREATE POLICY "Users can delete their own projects" ON projects FOR DELETE TO authenticated USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- Tasks
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can create their own tasks') THEN
            CREATE POLICY "Users can create their own tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view their own tasks') THEN
            CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can update their own tasks') THEN
            CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can delete their own tasks') THEN
            CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- Events
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        ALTER TABLE events ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can create their own events') THEN
            CREATE POLICY "Users can create their own events" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can view their own events') THEN
            CREATE POLICY "Users can view their own events" ON events FOR SELECT TO authenticated USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can update their own events') THEN
            CREATE POLICY "Users can update their own events" ON events FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can delete their own events') THEN
            CREATE POLICY "Users can delete their own events" ON events FOR DELETE TO authenticated USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- User Integrations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_integrations') THEN
        ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_integrations' AND policyname = 'Users can view their own integrations') THEN
            CREATE POLICY "Users can view their own integrations" ON user_integrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_integrations' AND policyname = 'Users can update their own integrations') THEN
            CREATE POLICY "Users can update their own integrations" ON user_integrations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        END IF;
    END IF;

    -- Notes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN
        ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can create their own notes') THEN
            CREATE POLICY "Users can create their own notes" ON notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can view their own notes') THEN
            CREATE POLICY "Users can view their own notes" ON notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can update their own notes') THEN
            CREATE POLICY "Users can update their own notes" ON notes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can delete their own notes') THEN
            CREATE POLICY "Users can delete their own notes" ON notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- Emails
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emails') THEN
        ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emails' AND policyname = 'Users can create their own emails') THEN
            CREATE POLICY "Users can create their own emails" ON emails FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emails' AND policyname = 'Users can view their own emails') THEN
            CREATE POLICY "Users can view their own emails" ON emails FOR SELECT TO authenticated USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emails' AND policyname = 'Users can update their own emails') THEN
            CREATE POLICY "Users can update their own emails" ON emails FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emails' AND policyname = 'Users can delete their own emails') THEN
            CREATE POLICY "Users can delete their own emails" ON emails FOR DELETE TO authenticated USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- Courses
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
        ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Users can create their own courses') THEN
            CREATE POLICY "Users can create their own courses" ON courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Users can view their own courses') THEN
            CREATE POLICY "Users can view their own courses" ON courses FOR SELECT TO authenticated USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Users can update their own courses') THEN
            CREATE POLICY "Users can update their own courses" ON courses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Users can delete their own courses') THEN
            CREATE POLICY "Users can delete their own courses" ON courses FOR DELETE TO authenticated USING (auth.uid() = user_id);
        END IF;
    END IF;

    -- Assignments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments') THEN
        ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignments' AND policyname = 'Users can create their own assignments') THEN
            CREATE POLICY "Users can create their own assignments" ON assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignments' AND policyname = 'Users can view their own assignments') THEN
            CREATE POLICY "Users can view their own assignments" ON assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignments' AND policyname = 'Users can update their own assignments') THEN
            CREATE POLICY "Users can update their own assignments" ON assignments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignments' AND policyname = 'Users can delete their own assignments') THEN
            CREATE POLICY "Users can delete their own assignments" ON assignments FOR DELETE TO authenticated USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;