import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// More detailed environment variable validation
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required');
}

// Ensure the URL is properly formatted
const formattedUrl = supabaseUrl.startsWith('https://') 
  ? supabaseUrl 
  : `https://${supabaseUrl.replace(/^(http:\/\/|\/\/)/i, '')}`;

// Create the Supabase client with retries and timeout configuration
export const supabase = createClient(formattedUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'sb-auth-token',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  },
  db: {
    schema: 'public'
  }
});

// Enhanced connection test function
export const testSupabaseConnection = async () => {
  try {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );
    
    const connectionTest = supabase.auth.getSession();
    
    const { data, error } = await Promise.race([connectionTest, timeout]);

    if (error) {
      console.error('Supabase connection error:', error);
      return {
        success: false,
        url: formattedUrl,
        error: error.message
      };
    }

    return {
      success: true,
      url: formattedUrl,
      message: 'Successfully connected to Supabase'
    };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return {
      success: false,
      url: formattedUrl,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};