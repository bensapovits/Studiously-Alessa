import { supabase } from './supabase';
import { sendEmail as sendGmailEmail } from './gmail';

export interface Email {
  id: string;
  subject: string;
  content: string;
  sent_at: string;
  direction: 'incoming' | 'outgoing';
  contact_id: string;
  user_id: string;
  created_at: string;
}

export async function getContactEmails(contactId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('emails')
    .select('*')
    .eq('contact_id', contactId)
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createEmail(email: Omit<Email, 'id' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
    // Save to database first
    const { data, error } = await supabase
      .from('emails')
      .insert([{ ...email, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;

    // Then try to send via Gmail if available
    try {
      await sendGmailEmail({
        to: [email.contact_id],
        subject: email.subject,
        body: email.content
      });
    } catch (gmailError) {
      if (gmailError.message !== 'Gmail not connected') {
        console.error('Error sending via Gmail:', gmailError);
      }
      // Continue even if Gmail fails - the email is already saved in the database
    }

    return data;
  } catch (error) {
    console.error('Error creating email:', error);
    throw error;
  }
}