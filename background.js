
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'getRemovedCount') {
        chrome.storage.local.get(['removedCount'], function(data) {
            sendResponse({count: data.removedCount || 0});
        });
        return true;
    }
});

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.get(['extensionEnabled'], function(data) {
        if (data.extensionEnabled === undefined) {
            chrome.storage.local.set({extensionEnabled: true});
        }
    });
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        if (tab.url && tab.url.includes('youtube.com')) {
            updateIconForTab(tab.id);
        }
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
        updateIconForTab(tabId);
    }
});

function updateIconForTab(tabId) {
    chrome.storage.local.get(['extensionEnabled'], function(data) {
        const isEnabled = data.extensionEnabled !== false;
    });
}