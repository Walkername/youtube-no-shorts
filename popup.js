
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleBtn');
    const statusText = document.getElementById('statusText');
    const removedCountElement = document.getElementById('removedCount');
    
    chrome.storage.local.get(['extensionEnabled', 'removedCount'], function(data) {
        const isEnabled = data.extensionEnabled !== false;
        const removedCount = data.removedCount || 0;
        
        updateUI(isEnabled, removedCount);
        
        chrome.runtime.sendMessage({action: 'getRemovedCount'}, function(response) {
            if (response && response.count !== undefined) {
                removedCountElement.textContent = response.count;
            }
        });
    });
    
    toggleBtn.addEventListener('click', function() {
        chrome.storage.local.get(['extensionEnabled'], function(data) {
            const currentState = data.extensionEnabled !== false;
            const newState = !currentState;
            
            chrome.storage.local.set({extensionEnabled: newState}, function() {
                updateUI(newState);
                
                chrome.tabs.query({url: "*://*.youtube.com/*"}, function(tabs) {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'toggleExtension',
                            enabled: newState
                        }, function(response) {
                            if (chrome.runtime.lastError) {
                            }
                        });
                    });
                });
                
                updateExtensionIcon(newState);
                
                showNotification(newState);
            });
        });
    });
    
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action === 'updateCounter') {
            removedCountElement.textContent = message.count;
        }
    });
    
    function updateUI(isEnabled, removedCount = 0) {
        if (isEnabled) {
            toggleBtn.textContent = 'Disable';
            toggleBtn.className = 'toggle-btn on';
            statusText.textContent = 'WORKS';
            statusText.className = 'status-on';
        } else {
            toggleBtn.textContent = 'Enable';
            toggleBtn.className = 'toggle-btn off';
            statusText.textContent = 'STOPPED';
            statusText.className = 'status-off';
        }
        
        if (removedCount) {
            removedCountElement.textContent = removedCount;
        }
    }
    
    function updateExtensionIcon(isEnabled) {
        const path = isEnabled ? {
            "16": "icon.png",
            "48": "icon.png",
            "128": "icon.png"
        } : {
            "16": "icon-disabled.png",
            "48": "icon-disabled.png",
            "128": "icon-disabled.png"
        };
        
        chrome.action.setIcon({path: path});
    }
    
    function showNotification(isEnabled) {
        const notificationOptions = {
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'YouTube Cleaner',
            message: isEnabled ? 'Extension enabled' : 'Extension disabled',
            priority: 1
        };
        
        chrome.notifications.create('toggleNotification', notificationOptions);
        
        setTimeout(() => {
            chrome.notifications.clear('toggleNotification');
        }, 3000);
    }
});