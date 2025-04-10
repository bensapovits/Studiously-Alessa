// Gmail contact extraction
function extractGmailContact() {
  // Get the email address from the currently open email
  const emailElement = document.querySelector('.gD')?.getAttribute('email');
  
  // Get the name from the email header
  const nameElement = document.querySelector('.gD')?.getAttribute('name');
  
  if (!emailElement) return null;

  return {
    name: nameElement || emailElement.split('@')[0],
    email: emailElement
  };
}

// Listen for sync request from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'syncGmail') {
    const contactData = extractGmailContact();
    if (contactData) {
      chrome.runtime.sendMessage({
        action: 'syncContact',
        data: contactData
      });
    }
  }
});