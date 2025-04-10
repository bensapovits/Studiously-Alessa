// LinkedIn contact extraction
function extractLinkedInProfile() {
  const name = document.querySelector('h1')?.textContent?.trim();
  const headline = document.querySelector('.text-body-medium')?.textContent?.trim();
  
  // Get current company
  const experienceSection = document.querySelector('#experience');
  const currentCompany = experienceSection?.querySelector('.experience-group')
    ?.querySelector('.hoverable-link-text')?.textContent?.trim();

  // Get education
  const educationSection = document.querySelector('#education');
  const college = educationSection?.querySelector('.hoverable-link-text')
    ?.textContent?.trim();

  // Get profile URL
  const profileUrl = window.location.href.split('?')[0];

  return {
    name,
    company: currentCompany,
    college,
    linkedin: profileUrl
  };
}

// Listen for sync request from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'syncLinkedIn') {
    const profileData = extractLinkedInProfile();
    chrome.runtime.sendMessage({
      action: 'syncContact',
      data: profileData
    });
  }
});