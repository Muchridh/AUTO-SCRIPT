// background.js — Service Worker
// Auto Script Kuesioner SIMA Chrome Extension
// by muchrid

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Clear install state on fresh extension install
    chrome.storage.local.remove('sima_installed');
    console.log('[AutoScript] Extension installed. Showing install screen on next popup open.');
  }
});
