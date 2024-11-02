const button = document.getElementById('downloadButton');

button.addEventListener('click', function() {
    console.log('Download button clicked');
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const activeTab = tabs[0];
        console.log('Active tab:', activeTab);
        
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['content.js']
        }, function() {
            if (chrome.runtime.lastError) {
                console.error('Failed to inject content script:', chrome.runtime.lastError);
                return;
            }
            console.log('Content script injection successful');
            
            // Add a delay and log before sending message
            setTimeout(() => {
                console.log('Attempting to send message to content script');
                chrome.tabs.sendMessage(activeTab.id, { action: "downloadPage" }, function(response) {
                    console.log('Message sent to content script');
                    if (chrome.runtime.lastError) {
                        console.error('Error sending message:', chrome.runtime.lastError);
                    } else {
                        console.log('Response from content script:', response);
                    }
                });
            }, 500); // Increased delay to 500ms
        });
    });
});