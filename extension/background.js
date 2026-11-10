// JIOSI Inbox — Chrome Side Panel Service Worker
// Manifest V3: Configures side panel to open on toolbar icon click

chrome.runtime.onInstalled.addListener(() => {
  console.log('[JIOSI Action Assistant] Extension installed/updated');
  // Configure side panel to open automatically when user clicks the extension icon on toolbar
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error('[JIOSI] Error setting panel behavior:', error));
  }
});

// Listen for tab updates to notify side panel of URL changes if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.includes('mail.google.com')) {
    chrome.runtime.sendMessage({
      type: 'GMAIL_TAB_UPDATED',
      tabId: tabId,
      url: changeInfo.url
    }).catch(() => {
      // Ignored if side panel is not currently open
    });
  }
});

