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
            // Handle bullet points
            else if (block.classList.contains('notion-bulleted_list-block')) {
                // Look for the notranslate div inside the bullet point
                const bulletText = block.querySelector('.notranslate');
                if (bulletText && bulletText.textContent.trim()) {
                    contentArray.push({
                        type: 'bulletList',
                        items: [{
                            text: bulletText.textContent.trim(),
                            level: getListItemLevel(block, 'notion-bulleted_list-block')
                        }]
                    });
                }
            }
            // Handle numbered list points
            else if (block.classList.contains('notion-numbered_list-block')) {
                // Look for the notranslate div inside the numbered list point
                const bulletText = block.querySelector('.notranslate');
                if (bulletText && bulletText.textContent.trim()) {
                    contentArray.push({
                        type: 'numberList',
                        items: [{
                            text: bulletText.textContent.trim(),
                            level: getListItemLevel(block, 'notion-numbered_list-block')
                        }]
                    });
                }
            }
            // Handle regular text
            else if (block.classList.contains('notion-text-block')) {
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


function getListItemLevel(item, className) {
    let level = 1;
    let parent = item.parentElement;
    let classSearchText = className === 'notion-numbered_list-block' ? className : 'notion-bulleted_list-block';
    while (parent) {
        if (parent.classList.contains(classSearchText)) {
            level++;
        }
        parent = parent.parentElement;
    }
    return level;
}


// the content.js needs to have a duplex channel open for
// async communication with the background worker.
// That is the reason I am using Promises.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Message received in content script:', request);
    
    if (request.action === "downloadPage") {
        const extractedContent = extractNotionContent();
        console.log('Request.content: ', extractedContent)
        
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