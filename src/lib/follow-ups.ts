import { supabase } from './supabase';
import { addDays } from 'date-fns';

export interface FollowUp {
  id: string;
  contact_id: string;
  user_id: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  next_due_date: string;
  last_completed?: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'completed' | 'snoozed';
  snooze_until?: string;
  notes?: string;
}

const FREQUENCY_DAYS = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  semiannual: 180,
  annual: 365
};

export async function getFollowUp(contactId: string): Promise<FollowUp | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('follow_ups')
    .select('*')
    .eq('contact_id', contactId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error getting follow-up:', error);
    return null;
  }

  return data;
}

export async function createFollowUp(contactId: string, frequency: FollowUp['frequency'], notes?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const nextDueDate = addDays(new Date(), FREQUENCY_DAYS[frequency]);

  // Check if a follow-up already exists for this contact
  const { data: existingFollowUp } = await supabase
    .from('follow_ups')
    .select('*')
    .eq('contact_id', contactId)
    .maybeSingle();

  if (existingFollowUp) {
    // Update existing follow-up
    const { data, error } = await supabase
      .from('follow_ups')
      .update({
        frequency,
        next_due_date: nextDueDate.toISOString(),
        notes: notes || existingFollowUp.notes,
        status: 'pending',
        snooze_until: null
      })
      .eq('id', existingFollowUp.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new follow-up
    const { data, error } = await supabase
      .from('follow_ups')
      .insert([{
        contact_id: contactId,
        user_id: user.id,
        frequency,
        next_due_date: nextDueDate.toISOString(),
        notes
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function completeFollowUp(id: string, frequency: FollowUp['frequency']) {
  const nextDueDate = addDays(new Date(), FREQUENCY_DAYS[frequency]);

  const { data, error } = await supabase
    .from('follow_ups')
    .update({
      last_completed: new Date().toISOString(),
      next_due_date: nextDueDate.toISOString(),
      status: 'completed'
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function snoozeFollowUp(id: string, days: number) {
  const snoozeUntil = addDays(new Date(), days);

  const { data, error } = await supabase
    .from('follow_ups')
    .update({
      status: 'snoozed',
      snooze_until: snoozeUntil.toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFollowUpFrequency(id: string, frequency: FollowUp['frequency']) {
  const nextDueDate = addDays(new Date(), FREQUENCY_DAYS[frequency]);

  const { data, error } = await supabase
    .from('follow_ups')
    .update({
      frequency,
      next_due_date: nextDueDate.toISOString(),
      status: 'pending',
      snooze_until: null
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}