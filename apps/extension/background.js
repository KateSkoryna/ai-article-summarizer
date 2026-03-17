// Background service worker for Chrome Extension
// Handles side panel behavior

chrome.runtime.onInstalled.addListener(() => {
  console.log("AI Article Summarizer extension installed");

  // Configure side panel to open when extension icon is clicked
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error("Error setting panel behavior:", error));
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener(() => {
  console.log("Extension icon clicked, side panel should open");
});
