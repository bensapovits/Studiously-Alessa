import { supabase } from './supabase';

interface GmailTokens {
  accessToken: string;
  refreshToken: string;
}

interface EmailAttachment {
  filename: string;
  content: string;
  mimeType: string;
}

interface EmailOptions {
  to: string[];
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
  scheduledTime?: string;
}

// Get Gmail tokens from user_integrations table
export async function getGmailTokens(): Promise<GmailTokens | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching Gmail tokens:', error);
    return null;
  }

  if (!integration?.google_access_token) {
    return null;
  }

  // Check if token is expired and needs refresh
  if (integration.google_token_expiry && new Date(integration.google_token_expiry) < new Date()) {
    return await refreshGmailTokens(integration.google_refresh_token);
  }

  return {
    accessToken: integration.google_access_token,
    refreshToken: integration.google_refresh_token
  };
}

// Refresh Gmail tokens using refresh token
async function refreshGmailTokens(refreshToken: string): Promise<GmailTokens | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh token');
      return null;
    }

    const data = await response.json();
    
    // Update tokens in database
    const { error } = await supabase
      .from('user_integrations')
      .update({
        google_access_token: data.access_token,
        google_token_expiry: new Date(Date.now() + data.expires_in * 1000).toISOString()
      })
      .eq('google_refresh_token', refreshToken);

    if (error) {
      console.error('Error updating Gmail tokens:', error);
      return null;
    }

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken
    };
  } catch (error) {
    console.error('Error refreshing Gmail token:', error);
    return null;
  }
}

// Create email MIME message
function createMimeMessage(options: EmailOptions): string {
  const boundary = `boundary_${Date.now().toString(36)}`;
  const message = [
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    'To: ' + options.to.join(', '),
    'Subject: ' + options.subject,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    options.body,
  ];

  // Add attachments if any
  if (options.attachments?.length) {
    options.attachments.forEach(attachment => {
      message.push(
        `--${boundary}`,
        `Content-Type: ${attachment.mimeType}`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        '',
        attachment.content
      );
    });
  }

  message.push(`--${boundary}--`);
  return message.join('\r\n');
}

// Send email using Gmail API
export async function sendEmail(options: EmailOptions): Promise<void> {
  const tokens = await getGmailTokens();
  if (!tokens) {
    throw new Error('Gmail not connected');
  }

  try {
    const mimeMessage = createMimeMessage(options);
    
    // Encode the message in base64URL format
    const encodedMessage = btoa(mimeMessage)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const requestBody: any = {
      raw: encodedMessage
    };

    // Add scheduling if specified
    if (options.scheduledTime) {
      requestBody.sendTime = new Date(options.scheduledTime).toISOString();
    }

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    // Log email activity
    await logEmailActivity(options);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Log email activity in the database
async function logEmailActivity(options: EmailOptions): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('emails')
    .insert({
      subject: options.subject,
      content: options.body,
      sent_at: options.scheduledTime || new Date().toISOString(),
      direction: 'outgoing',
      user_id: user.id,
      // Add contact_id if sending to a contact in the database
      contact_id: await getContactIdFromEmail(options.to[0])
    });

  if (error) throw error;
}

// Helper to get contact_id from email address
async function getContactIdFromEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

// Rate limiting helper
const rateLimiter = {
  tokens: 100, // Gmail API quota
  lastRefill: Date.now(),
  refillRate: 100 / (24 * 60 * 60 * 1000), // 100 tokens per day

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    this.tokens = Math.min(100, this.tokens + timePassed * this.refillRate);
    this.lastRefill = now;

    if (this.tokens < 1) {
      throw new Error('Gmail API rate limit exceeded. Please try again later.');
    }

    this.tokens -= 1;
    return true;
  }
};