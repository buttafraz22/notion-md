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
          
          case 'numberList':
            const counters = [];

            return item.items.map(listItem => {
                const level = listItem.level;
                const indent = '   '.repeat(level - 1);
                
                
                if (counters.length < level) {
                    counters.push(1); 
                } else {
                    counters[level - 1] += 1;
                }
                
                // Reset deeper levels if any
                counters.length = level;

                // Get the appropriate marker for this level
                const marker = getLevelMarker(level, counters[level - 1]);
                
                return `${indent}${marker} ${listItem.text}`;
            }).join('\n') + '\n\n';
            
          case 'code':
              return `\`\`\`${item.language}\n${item.text}\n\`\`\`\n\n`;
          
          default:
              return '';
      }
  }).join('');
}


function toRoman(num) {
    const romanNumerals = [
        ['x', 10], ['ix', 9], ['v', 5], ['iv', 4], ['i', 1]
    ];
    let result = '';
    for (const [letter, value] of romanNumerals) {
        while (num >= value) {
            result += letter;
            num -= value;
        }
    }
    return result;
}

function getLevelMarker(level, counter) {
    if (level === 1) {
        return `${counter}.`; // 1., 2., 3.
    } else if (level === 2) {
        return `${String.fromCharCode(96 + counter)}.`; // a., b., c.
    } else if (level === 3) {
        return `${toRoman(counter)}.`; // i., ii., iii.
    } else {
        return `${counter}.`;
    }
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);

  if (request.action === "processExtractedContent") {
      try {
        
          const markdown = convertToMarkdown(request.content);
          
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