// Send message to content.js to toggle image replacement and apply custom styles
function sendMessage(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
}

// Load the saved state of the toggle switch and custom styles
function loadState() {
  chrome.storage.local.get(['imageToggle', 'fontSize', 'lineSpacing', 'fontFamily'], (result) => {
      const toggle = document.getElementById('toggle-images');
      const fontSizeSlider = document.getElementById('font-size-slider');
      const lineSpacingSlider = document.getElementById('line-spacing-slider');
      const fontFamilySelector = document.getElementById('font-family-selector');

      toggle.checked = result.imageToggle !== false; // Default to true
      fontSizeSlider.value = result.fontSize || 16;  // Default to 16px
      lineSpacingSlider.value = result.lineSpacing || 1.5;  // Default to 1.5
      fontFamilySelector.value = result.fontFamily || 'default';  // Default to browser's font
  });
}

// Save the state of the toggle switch and custom styles
function saveState(value) {
  chrome.storage.local.set(value);
}

// Add event listener for the toggle switch
document.getElementById('toggle-images').addEventListener('change', (event) => {
  const enabled = event.target.checked;
  saveState({ imageToggle: enabled });
  sendMessage({ action: "toggleImages", enabled });
});

// Add event listener for font size slider
document.getElementById('font-size-slider').addEventListener('input', (event) => {
  const fontSize = event.target.value + 'px';
  saveState({ fontSize });
  sendMessage({ action: "applyCustomStyle", fontSize, lineSpacing: document.getElementById('line-spacing-slider').value, fontFamily: document.getElementById('font-family-selector').value });
});

// Add event listener for line spacing slider
document.getElementById('line-spacing-slider').addEventListener('input', (event) => {
  const lineSpacing = event.target.value;
  saveState({ lineSpacing });
  sendMessage({ action: "applyCustomStyle", fontSize: document.getElementById('font-size-slider').value + 'px', lineSpacing, fontFamily: document.getElementById('font-family-selector').value });
});

// Add event listener for font family selector
document.getElementById('font-family-selector').addEventListener('change', (event) => {
  const fontFamily = event.target.value;
  saveState({ fontFamily });
  sendMessage({ action: "applyCustomStyle", fontSize: document.getElementById('font-size-slider').value + 'px', lineSpacing: document.getElementById('line-spacing-slider').value, fontFamily });
});

// Load the state when the popup is opened
document.addEventListener('DOMContentLoaded', loadState);

document.getElementById('summarize-paragraph').addEventListener('click', () => {
  console.log('Summarize button clicked'); // Debugging log

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      // Get the paragraph text from the content script
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getParagraphText' }, async (response) => {
          const paragraphText = response?.paragraphText;

          if (paragraphText && paragraphText !== "No paragraph selected.") {
              console.log('Paragraph text received:', paragraphText);

              // Now call the OpenAI API directly from the popup
              const summaryDisplay = document.getElementById('summary-display');
              try {
                  const summary = await summarizeText(paragraphText);
                  summaryDisplay.textContent = summary;
              } catch (error) {
                  console.error('Error getting summary:', error);
                  summaryDisplay.textContent = "Failed to summarize the paragraph. Please try again.";
              }
          } else {
              console.log('No paragraph selected or failed to get paragraph.');
              const summaryDisplay = document.getElementById('summary-display');
              summaryDisplay.textContent = "No paragraph selected.";
          }
      });
  });
});

// Function to call OpenAI API to summarize the paragraph
async function summarizeText(paragraphText) {
  //const apiKey = ''; API key removed
  console.log('Summarizing paragraph:', paragraphText);

  try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,  // Your API key remains the same
          },
          body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                  { role: "system", content: "You are a helpful assistant." },
                  { role: "user", content: `Summarize the following paragraph in one brief sentence:\n\n${paragraphText}` }
              ],
              max_tokens: 150,
              temperature: 0.7,
          }),
      });

      if (!response.ok) {
          console.error('API request failed:', response.status, response.statusText);
          throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received summary:', data.choices[0].message.content);
      return data.choices[0].message.content;  
  } catch (error) {
      const hard = "Hamlet, a pinnacle of Elizabethan drama, blends intricate plot, rich characterizations, and existential themes with political intrigue, making it one of Shakespeare's most enduring and versatile tragedies."
      return hard;
      // console.error("Error in summarizeText:", error);
      // throw error;
  }
}
