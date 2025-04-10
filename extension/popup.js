let supabaseUrl = '';
let supabaseKey = '';

// Initialize connection status
document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('connectionStatus');
  const loginButton = document.getElementById('loginButton');
  const syncButton = document.getElementById('syncButton');

  // Check if user is logged in
  chrome.storage.local.get(['session', 'supabaseUrl', 'supabaseKey'], async (result) => {
    supabaseUrl = result.supabaseUrl;
    supabaseKey = result.supabaseKey;
    
    if (result.session) {
      statusDiv.textContent = 'Connected to Studiously';
      statusDiv.className = 'status connected';
      loginButton.textContent = 'Logout';
      syncButton.disabled = false;
    } else {
      statusDiv.textContent = 'Not connected to Studiously';
      statusDiv.className = 'status disconnected';
      loginButton.textContent = 'Login';
      syncButton.disabled = true;
    }
  });

  // Handle login/logout
  loginButton.addEventListener('click', async () => {
    const session = await chrome.storage.local.get(['session']);
    if (session.session) {
      // Logout
      await chrome.storage.local.remove(['session']);
      statusDiv.textContent = 'Not connected to Studiously';
      statusDiv.className = 'status disconnected';
      loginButton.textContent = 'Login';
      syncButton.disabled = true;
    } else {
      // Login
      chrome.runtime.sendMessage({ action: 'login' });
    }
  });

  // Handle sync button
  syncButton.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url.includes('linkedin.com/in/')) {
      chrome.tabs.sendMessage(tab.id, { action: 'syncLinkedIn' });
    } else if (tab.url.includes('mail.google.com')) {
      chrome.tabs.sendMessage(tab.id, { action: 'syncGmail' });
    }
  });
});