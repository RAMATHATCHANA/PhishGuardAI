chrome.storage.sync.get(['language'], (result) => {
  const langSelect = document.getElementById('language');
  if (result.language) {
    langSelect.value = result.language;
  }
});

document.getElementById('language').addEventListener('change', (e) => {
  chrome.storage.sync.set({ language: e.target.value });
});

document.getElementById('scanBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'scan' });
  window.close();
});
