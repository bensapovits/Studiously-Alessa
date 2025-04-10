import { createClient } from '@supabase/supabase-js';

let supabase = null;

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  // Initialize with your Supabase details
  chrome.storage.local.set({
    supabaseUrl: "https://hdtejvrrrooveyrvrhtl.supabase.co",
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdGVqdnJycm9vdmV5cnZyaHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2NTEwOTgsImV4cCI6MjA1NzIyNzA5OH0.nV1bU6JbnjvLuX2vUFsEUQIcseEVYemKACdB4HALiv4"
  });
});

// Initialize Supabase client
chrome.storage.local.get(['supabaseUrl', 'supabaseKey'], (result) => {
  if (result.supabaseUrl && result.supabaseKey) {
    supabase = createClient(result.supabaseUrl, result.supabaseKey);
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'login') {
    handleLogin();
  } else if (message.action === 'syncContact') {
    handleContactSync(message.data);
  }
});

async function handleLogin() {
  if (!supabase) return;

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: chrome.runtime.getURL('oauth.html')
      }
    });

    if (error) throw error;

    // Store session
    await chrome.storage.local.set({ session: data.session });
    
    // Notify popup to update UI
    chrome.runtime.sendMessage({ action: 'loginSuccess' });
  } catch (error) {
    console.error('Login error:', error);
    chrome.runtime.sendMessage({ action: 'loginError', error: error.message });
  }
}

async function handleContactSync(contactData) {
  if (!supabase) return;

  try {
    const { data: session } = await chrome.storage.local.get(['session']);
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        ...contactData,
        user_id: session.user.id,
        stage: 'New',
        last_contacted: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    chrome.runtime.sendMessage({ 
      action: 'syncSuccess',
      data: data
    });
  } catch (error) {
    console.error('Sync error:', error);
    chrome.runtime.sendMessage({ 
      action: 'syncError',
      error: error.message
    });
  }
}