/*
  # Task Management System - Complete Database Schema
  
  ## Overview
  This migration creates a comprehensive distributed task management system similar to ClickUp.
  
  ## New Tables
  
  ### 1. users
  - `id` (uuid, primary key)
  - `name` (text)
  - `email` (text, unique)
  - `password` (text, hashed)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. workspaces
  - `id` (uuid, primary key)
  - `name` (text)
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 3. workspace_members
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `workspace_id` (uuid, foreign key to workspaces)
  - `role` (text: 'OWNER', 'ADMIN', 'MEMBER')
  - `joined_at` (timestamptz)
  
  ### 4. projects
  - `id` (uuid, primary key)
  - `name` (text)
  - `workspace_id` (uuid, foreign key to workspaces)
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 5. tasks
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text)
  - `status` (text: 'TODO', 'IN_PROGRESS', 'DONE')
  - `priority` (text: 'LOW', 'MEDIUM', 'HIGH', 'URGENT')
  - `due_date` (timestamptz)
  - `project_id` (uuid, foreign key to projects)
  - `created_by` (uuid, foreign key to users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 6. task_assignments
  - `id` (uuid, primary key)
  - `task_id` (uuid, foreign key to tasks)
  - `user_id` (uuid, foreign key to users)
  - `assigned_at` (timestamptz)
  
  ### 7. task_comments
  - `id` (uuid, primary key)
  - `task_id` (uuid, foreign key to tasks)
  - `user_id` (uuid, foreign key to users)
  - `content` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 8. task_attachments
  - `id` (uuid, primary key)
  - `task_id` (uuid, foreign key to tasks)
  - `file_path` (text)
  - `original_filename` (text)
  - `file_size` (integer)
  - `file_type` (text)
  - `uploaded_by` (uuid, foreign key to users)
  - `uploaded_at` (timestamptz)
  
  ### 9. notifications
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `task_id` (uuid, foreign key to tasks)
  - `type` (text: 'DUE_DATE', 'PRIORITY', 'ASSIGNMENT', 'COMMENT')
  - `message` (text)
  - `is_read` (boolean)
  - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Policies enforce workspace membership and role-based permissions
  - Users can only access data in workspaces they belong to
  - OWNER and ADMIN roles have elevated permissions
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 255),
  email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password text NOT NULL CHECK (char_length(password) >= 60), -- bcrypt hashes are 60 chars
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 255),
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspace_members table (RBAC foundation)
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')) DEFAULT 'MEMBER',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 255),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 255),
  description text DEFAULT '',
  status text NOT NULL CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')) DEFAULT 'TODO',
  priority text NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) DEFAULT 'MEDIUM',
  due_date timestamptz,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) >= 1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  original_filename text NOT NULL,
  file_size integer CHECK (file_size > 0 AND file_size <= 10485760), -- Max 10MB
  file_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('DUE_DATE', 'PRIORITY', 'ASSIGNMENT', 'COMMENT')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON workspace_members(role);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for workspaces table
CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create workspaces"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Workspace owners can update workspaces"
  ON workspaces FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'OWNER'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'OWNER'
    )
  );

CREATE POLICY "Workspace owners can delete workspaces"
  ON workspaces FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role = 'OWNER'
    )
  );

-- RLS Policies for workspace_members table
CREATE POLICY "Workspace members can view other members"
  ON workspace_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners and admins can add members"
  ON workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_members.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Workspace owners and admins can update member roles"
  ON workspace_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('OWNER', 'ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Workspace owners and admins can remove members"
  ON workspace_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('OWNER', 'ADMIN')
    )
  );

-- RLS Policies for projects table
CREATE POLICY "Workspace members can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners and admins can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('OWNER', 'ADMIN')
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Workspace owners and admins can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('OWNER', 'ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Workspace owners and admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = projects.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('OWNER', 'ADMIN')
    )
  );

-- RLS Policies for tasks table
CREATE POLICY "Workspace members can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE projects.id = tasks.project_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE projects.id = tasks.project_id
      AND workspace_members.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Workspace members can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE projects.id = tasks.project_id
      AND workspace_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE projects.id = tasks.project_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners and admins can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE projects.id = tasks.project_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('OWNER', 'ADMIN')
    )
  );

-- RLS Policies for task_assignments table
CREATE POLICY "Workspace members can view task assignments"
  ON task_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = task_assignments.task_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners and admins can assign tasks"
  ON task_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = task_assignments.task_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Workspace owners and admins can remove task assignments"
  ON task_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = task_assignments.task_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('OWNER', 'ADMIN')
    )
  );

-- RLS Policies for task_comments table
CREATE POLICY "Workspace members can view task comments"
  ON task_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = task_comments.task_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create comments"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = task_comments.task_id
      AND workspace_members.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own comments"
  ON task_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can delete comments"
  ON task_comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = task_comments.task_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('OWNER', 'ADMIN')
    )
  );

-- RLS Policies for task_attachments table
CREATE POLICY "Workspace members can view task attachments"
  ON task_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = task_attachments.task_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can upload attachments"
  ON task_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = task_attachments.task_id
      AND workspace_members.user_id = auth.uid()
    )
    AND auth.uid() = uploaded_by
  );

CREATE POLICY "Users and admins can delete attachments"
  ON task_attachments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = task_attachments.task_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('OWNER', 'ADMIN')
    )
  );

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);