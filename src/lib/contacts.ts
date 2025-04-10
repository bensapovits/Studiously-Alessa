import { supabase } from './supabase';

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  company?: string;
  college?: string;
  stage: string;
  last_contacted: string;
  created_at: string;
  user_id: string;
  [key: string]: any; // For custom fields
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'date' | 'email' | 'phone' | 'url';
}

// Valid stages based on the database constraint
export const validStages = [
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
] as const;

export type ValidStage = typeof validStages[number];

export async function createContact(contact: Omit<Contact, 'id' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (!validStages.includes(contact.stage as ValidStage)) {
    throw new Error('Invalid stage value');
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert([{ ...contact, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getContact(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateContact(id: string, updates: Partial<Contact>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (updates.stage && !validStages.includes(updates.stage as ValidStage)) {
    throw new Error('Invalid stage value');
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContactLastContacted(id: string) {
  return updateContact(id, { last_contacted: new Date().toISOString() });
}

export async function getContactTasks(contactId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('contact_id', contactId)
    .eq('user_id', user.id)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getContactEvents(contactId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('contact_id', contactId)
    .eq('user_id', user.id)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function deleteCustomField(fieldName: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('delete_custom_field', { field_name: fieldName });

  if (error) {
    // Handle specific error cases
    if (error.message.includes('core column')) {
      throw new Error('Cannot delete a core field');
    }
    if (error.message.includes('does not exist')) {
      throw new Error('Field does not exist');
    }
    throw error;
  }

  return data;
}

export async function updateCustomField(oldName: string, newName: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First check if the old column exists
  const { data: columnExists, error: checkError } = await supabase
    .rpc('check_column_exists', { table_name: 'contacts', column_name: oldName });

  if (checkError) throw checkError;
  if (!columnExists) throw new Error('Field does not exist');

  // Then rename the column
  const { error } = await supabase
    .rpc('rename_custom_field', { old_name: oldName, new_name: newName });

  if (error) {
    if (error.message.includes('core column')) {
      throw new Error('Cannot rename a core field');
    }
    throw error;
  }

  return true;
}

export async function addCustomField(fieldName: string, fieldType: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First check if the column already exists
  const { data: columnExists, error: checkError } = await supabase
    .rpc('check_column_exists', { table_name: 'contacts', column_name: fieldName });

  if (checkError) throw checkError;
  
  // Throw a more descriptive error if the column exists
  if (columnExists) {
    throw new Error(`Field "${fieldName}" already exists`);
  }

  // Add the new column
  const { error } = await supabase
    .rpc('add_custom_field', { field_name: fieldName, field_type: fieldType });

  if (error) {
    // Handle specific error cases
    if (error.message.includes('already exists')) {
      throw new Error(`Field "${fieldName}" already exists`);
    }
    throw error;
  }

  return true;
}