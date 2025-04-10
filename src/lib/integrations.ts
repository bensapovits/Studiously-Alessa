import { supabase } from './supabase';

// OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/callback`;
const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
const LINKEDIN_REDIRECT_URI = `${window.location.origin}/oauth/linkedin/callback`;

// Google OAuth scopes
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/contacts.readonly'
].join(' ');

// LinkedIn OAuth scopes
const LINKEDIN_SCOPES = [
  'r_emailaddress',
  'r_liteprofile',
  'r_organization_social'
].join(' ');

export async function initiateGoogleAuth() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const state = generateRandomState();
    localStorage.setItem('oauth_state', state);
    
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: GOOGLE_SCOPES,
      access_type: 'offline',
      state: state,
      prompt: 'consent',
      include_granted_scopes: 'true'
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  } catch (error) {
    console.error('Error initiating Google auth:', error);
    throw error;
  }
}

export async function handleGoogleCallback(code: string, state: string) {
  try {
    // Verify state to prevent CSRF attacks
    const storedState = localStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    localStorage.removeItem('oauth_state');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Save tokens to database
    const { error: updateError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        google_last_sync: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Error handling Google callback:', error);
    throw error;
  }
}

// Helper function to generate random state
function generateRandomState() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Integration status check
export async function getIntegrationStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First check if a record exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id);

    if (checkError) throw checkError;

    // If no record exists, create one
    if (!existingRecord || existingRecord.length === 0) {
      const { error: insertError } = await supabase
        .from('user_integrations')
        .insert([{ user_id: user.id }]);

      if (insertError) throw insertError;

      return {
        google: { connected: false, lastSync: null },
        linkedin: { connected: false, lastSync: null }
      };
    }

    const record = existingRecord[0];
    return {
      google: {
        connected: Boolean(record?.google_access_token),
        lastSync: record?.google_last_sync
      },
      linkedin: {
        connected: Boolean(record?.linkedin_access_token),
        lastSync: record?.linkedin_last_sync
      }
    };
  } catch (error) {
    console.error('Error checking integration status:', error);
    return {
      google: { connected: false, lastSync: null },
      linkedin: { connected: false, lastSync: null }
    };
  }
}