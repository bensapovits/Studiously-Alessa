import { supabase } from './supabase';

export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  completed: boolean;
  status: 'Not Started' | 'In Progress' | 'Completed';
  created_at: string;
  user_id: string;
  project?: {
    name: string;
    color: string;
  };
}

export async function getTasks() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects(name, color)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'status'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ ...task, user_id: user.id, status: 'Not Started' }])
    .select(`
      *,
      project:projects(name, color)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(`
      *,
      project:projects(name, color)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function toggleTaskComplete(id: string, completed: boolean) {
  return updateTask(id, { 
    completed,
    status: completed ? 'Completed' : 'Not Started'
  });
}