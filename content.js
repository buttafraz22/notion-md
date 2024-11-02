// content.js
console.log('Content script loaded and running');
function extractNotionContent() {
    const contentArray = [];
    
    // Add title as first element
    contentArray.push({
        type: 'title',
        text: document.title
    });

    // Extract main content
    const mainContent = document.querySelector('.notion-page-content');
    if (mainContent) {
        const blocks = mainContent.querySelectorAll('[class*="notion-"][class*="-block"]');
        
        blocks.forEach(block => {
            // Handle headers
            if (block.classList.contains('notion-header-block')) {
                let level = 1;
                if (block.classList.contains('notion-h1-block')) level = 1;
                else if (block.classList.contains('notion-h2-block')) level = 2;
                else if (block.classList.contains('notion-h3-block')) level = 3;
                
                contentArray.push({
                    type: 'heading',
                    level: level,
                    text: block.textContent.trim()
                });
            }
            // Handle regular text
            else if (block.classList.contains('notion-text-block')) {
                // Check if the text block contains a notion page link
                const pageLink = block.querySelector('.notion-page-link');
                if (pageLink) {
                    contentArray.push({
                        type: 'link',
                        text: pageLink.textContent.trim(),
                        href: pageLink.href
                    });
                } else {
                    contentArray.push({
                        type: 'paragraph',
                        text: block.textContent.trim()
                    });
                }
            }
            // Handle lists
            else if (block.classList.contains('notion-bulleted-list')) {
                contentArray.push({
                    type: 'list',
                    items: Array.from(block.querySelectorAll('.notion-list-item'))
                        .map(item => item.textContent.trim())
                });
            }
            // Handle code blocks
            else if (block.classList.contains('notion-code-block')) {
                contentArray.push({
                    type: 'code',
                    text: block.textContent.trim(),
                    language: block.getAttribute('data-language') || 'plain'
                });
            }
        });
    }

    return contentArray;
}


// the content.js needs to have a duplex channel open for
// async communication with the background worker.
// That is the reason I am using Promises.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Message received in content script:', request);
    
    if (request.action === "downloadPage") {
        const extractedContent = extractNotionContent();
        
        chrome.runtime.sendMessage({
            action: "processExtractedContent",
            content: extractedContent
        }).then(response => {
            console.log('Successfully sent to background:', response);
            sendResponse({ status: "Content extracted and sent successfully" });
        }).catch(error => {
            console.error('Error sending to background:', error);
            sendResponse({ status: "Error", error: error.message });
        });
        
        return true;
    }
});