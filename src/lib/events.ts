import { supabase } from './supabase';

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: 'meeting' | 'assignment' | 'event';
  start_time: string;
  end_time?: string;
  location?: string;
  created_at: string;
  user_id: string;
}

// Cache for events to prevent unnecessary fetches
const eventCache = new Map<string, { data: Event[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getEvents(startDate: Date, endDate: Date) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const cacheKey = `${startDate.toISOString()}-${endDate.toISOString()}-${user.id}`;
  const cached = eventCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user.id)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: true });

  if (error) throw error;
  
  eventCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

export async function createEvent(event: Omit<Event, 'id' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Validate inputs
  if (!event.title || !event.start_time || !event.type) {
    throw new Error('Missing required fields');
  }

  const { data, error } = await supabase
    .from('events')
    .insert([{ ...event, user_id: user.id }])
    .select()
    .single();

  if (error) throw error;

  // Clear cache after modification
  eventCache.clear();
  return data;
}

export async function updateEvent(id: string, updates: Partial<Event>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  // Clear cache after modification
  eventCache.clear();
  return data;
}

export async function deleteEvent(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;

  // Clear cache after modification
  eventCache.clear();
}