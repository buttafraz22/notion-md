// background.js
function convertToMarkdown(contentArray) {
  return contentArray.map(item => {
      switch (item.type) {
          case 'title':
              return `# ${item.text}\n\n`;
          
          case 'heading':
              return `${'#'.repeat(item.level)} ${item.text}\n\n`;
          
          case 'paragraph':
              return `${item.text}\n\n`;
          
          case 'link':
              return `[${item.text}](${item.href})\n\n`;
          
          case 'bulletList':
              return item.items.map(bulletItem => {
                  // Add two spaces of indentation for each level
                  const indent = '  '.repeat(bulletItem.level - 1);
                  return `${indent}- ${bulletItem.text}`
              }).join('\n') + '\n\n';
          
          case 'code':
              return `\`\`\`${item.language}\n${item.text}\n\`\`\`\n\n`;
          
          default:
              return '';
      }
  }).join('');
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);

  if (request.action === "processExtractedContent") {
      try {
        
          const markdown = convertToMarkdown(request.content);
          
          // Convert to data URL instead of using Blob
          const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);
          
          const title = request.content[0]?.text || 'notion-export';
          const filename = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;

          chrome.downloads.download({
              url: dataUrl,
              filename: filename,
              saveAs: true
          }, (downloadId) => {
              if (chrome.runtime.lastError) {
                  console.error('Download error:', chrome.runtime.lastError);
                  sendResponse({ success: false, error: chrome.runtime.lastError });
              } else {
                  sendResponse({ success: true, downloadId: downloadId });
              }
          });

          return true;
      } catch (error) {
          console.error('Error processing content:', error);
          sendResponse({ success: false, error: error.message });
          return false;
      }
  }
  return true;
});