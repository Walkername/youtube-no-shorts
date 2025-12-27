
(function() {
    'use strict';
    
    let removedCount = 0;
    let isExtensionEnabled = true;
    let observer = null;
    let checkInterval = null;
    
    chrome.storage.local.get(['extensionEnabled', 'removedCount'], function(data) {
        isExtensionEnabled = data.extensionEnabled !== false;
        removedCount = data.removedCount || 0;
        
        if (isExtensionEnabled) {
            startExtension();
        } else {
            console.log('YouTube Cleaner: extension disabled');
        }
    });
    
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action === 'toggleExtension') {
            isExtensionEnabled = message.enabled;
            
            if (isExtensionEnabled) {
                startExtension();
                console.log('YouTube Cleaner: extension enabled');
            } else {
                stopExtension();
                console.log('YouTube Cleaner: extension disabled');
            }
            
            sendResponse({success: true});
        }
        
        if (message.action === 'getStatus') {
            sendResponse({
                enabled: isExtensionEnabled,
                removedCount: removedCount
            });
        }
    });
    
    function startExtension() {
        console.log('YouTube Cleaner: running...');
        removeElements();
        setupObserver();
        startPeriodicCheck();
    }
    
    function stopExtension() {
        console.log('YouTube Cleaner: stopping...');
        
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
    }
    
    function removeElements() {
        if (!isExtensionEnabled) return;
        
        const selectorsToRemove = [
            'ytd-rich-shelf-renderer',
            'grid-shelf-view-model'
        ];
        
        let elementsRemovedThisCycle = 0;
        
        selectorsToRemove.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                
                if (elements.length > 0) {
                    elements.forEach(element => {
                        try {
                            if (element && element.parentNode && isElementVisible(element)) {
                                element.style.cssText = `
                                    display: none !important;
                                    height: 0 !important;
                                    overflow: hidden !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                `;
                                
                                element.classList.add('youtube-cleaner-removed');
                                
                                elementsRemovedThisCycle++;
                            }
                        } catch (error) {
                        }
                    });
                }
            });
            
            if (elementsRemovedThisCycle > 0) {
                removedCount += elementsRemovedThisCycle;
                
                chrome.storage.local.set({removedCount: removedCount});
                
                chrome.runtime.sendMessage({
                    action: 'updateCounter',
                    count: removedCount
                });
            }
    }
    
    function isElementVisible(element) {
        return element.offsetWidth > 0 || 
               element.offsetHeight > 0 || 
               element.getClientRects().length > 0;
    }
    
    function setupObserver() {
        if (!window.MutationObserver) return;
        
        observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0) {
                    setTimeout(removeElements, 100);
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    function startPeriodicCheck() {
        checkInterval = setInterval(removeElements, 20000);
    }
    
    function setupYouTubeEvents() {
        document.addEventListener('yt-navigate-finish', removeElements);
        
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(removeElements, 500);
        }, { passive: true });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    function initialize() {
        setTimeout(function() {
            if (isExtensionEnabled) {
                removeElements();
                setupObserver();
                setupYouTubeEvents();
                startPeriodicCheck();
            }
        }, 1000);
        
        console.log('YouTube Cleaner initialized');
    }
    
    window.youtubeCleaner = {
        removeElements: removeElements,
        toggle: function() {
            isExtensionEnabled = !isExtensionEnabled;
            if (isExtensionEnabled) startExtension();
            else stopExtension();
            return isExtensionEnabled;
        },
        getStatus: function() {
            return {
                enabled: isExtensionEnabled,
                removedCount: removedCount
            };
        }
    };
    
})();