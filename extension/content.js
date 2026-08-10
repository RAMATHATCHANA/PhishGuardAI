const API_URL = 'http://localhost:8000';

const translations = {
  en: {
    scanning: 'Scanning page...',
    safe: 'This page appears safe',
    warning: 'Warning: Phishing detected',
    readAloud: 'Read Aloud'
  },
  ta: {
    scanning: 'பக்கத்தை ஸ்கேன் செய்கிறது...',
    safe: 'இந்த பக்கம் பாதுகாப்பானதாக தோன்றுகிறது',
    warning: 'எச்சரிக்கை: ஃபிஷிங் கண்டறியப்பட்டது',
    readAloud: 'சத்தமாக படி'
  },
  te: {
    scanning: 'పేజీని స్కాన్ చేస్తోంది...',
    safe: 'ఈ పేజీ సురక్షితంగా కనిపిస్తోంది',
    warning: 'హెచ్చరిక: ఫిషింగ్ గుర్తించబడింది',
    readAloud: 'బిగ్గరగా చదవండి'
  },
  ml: {
    scanning: 'പേജ് സ്കാൻ ചെയ്യുന്നു...',
    safe: 'ഈ പേജ് സുരക്ഷിതമാണെന്ന് തോന്നുന്നു',
    warning: 'മുന്നറിയിപ്പ്: ഫിഷിംഗ് കണ്ടെത്തി',
    readAloud: 'ഉറക്കെ വായിക്കുക'
  },
  kn: {
    scanning: 'ಪುಟವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    safe: 'ಈ ಪುಟ ಸುರಕ್ಷಿತವಾಗಿ ಕಾಣಿಸುತ್ತದೆ',
    warning: 'ಎಚ್ಚರಿಕೆ: ಫಿಶಿಂಗ್ ಪತ್ತೆಯಾಗಿದೆ',
    readAloud: 'ಗಟ್ಟಿಯಾಗಿ ಓದಿ'
  },
  hi: {
    scanning: 'पेज स्कैन हो रहा है...',
    safe: 'यह पेज सुरक्षित प्रतीत होता है',
    warning: 'चेतावनी: फ़िशिंग का पता चला',
    readAloud: 'जोर से पढ़ें'
  }
};

let currentLang = 'en';

chrome.storage.sync.get(['language'], (result) => {
  currentLang = result.language || 'en';
});

function getTranslation(key) {
  return translations[currentLang]?.[key] || translations.en[key];
}

function createOverlay(result) {
  const existingOverlay = document.getElementById('phishguard-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'phishguard-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 999999;
    max-width: 300px;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const isPhishing = result.label === 'Phishing';
  const bgColor = isPhishing ? '#fee2e2' : '#d1fae5';
  const textColor = isPhishing ? '#991b1b' : '#065f46';
  const icon = isPhishing ? '⚠️' : '✅';

  // Header container
  const headerDiv = document.createElement('div');
  headerDiv.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-bottom: 12px;';
  
  const iconSpan = document.createElement('span');
  iconSpan.style.fontSize = '24px';
  iconSpan.textContent = icon;
  
  const contentDiv = document.createElement('div');
  contentDiv.style.flex = '1';
  
  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = `font-weight: bold; color: ${textColor};`;
  statusDiv.textContent = isPhishing ? getTranslation('warning') : getTranslation('safe');
  
  const confidenceDiv = document.createElement('div');
  confidenceDiv.style.cssText = 'font-size: 12px; color: #666; margin-top: 4px;';
  confidenceDiv.textContent = `Confidence: ${(result.score * 100).toFixed(0)}%`;
  
  contentDiv.appendChild(statusDiv);
  contentDiv.appendChild(confidenceDiv);
  headerDiv.appendChild(iconSpan);
  headerDiv.appendChild(contentDiv);
  
  // Explanation container
  const explanationContainer = document.createElement('div');
  explanationContainer.style.cssText = `background: ${bgColor}; padding: 12px; border-radius: 8px; margin-bottom: 12px;`;
  
  const explanationText = document.createElement('div');
  explanationText.style.cssText = `font-size: 13px; color: ${textColor};`;
  explanationText.textContent = result.short_explanation || result.explanation;
  
  explanationContainer.appendChild(explanationText);
  
  // Button
  const speakBtn = document.createElement('button');
  speakBtn.id = 'phishguard-speak';
  speakBtn.style.cssText = `
    width: 100%;
    padding: 8px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  `;
  speakBtn.textContent = `🔊 ${getTranslation('readAloud')}`;
  
  overlay.appendChild(headerDiv);
  overlay.appendChild(explanationContainer);
  overlay.appendChild(speakBtn);
  document.body.appendChild(overlay);

  speakBtn.addEventListener('click', () => {
    const utterance = new SpeechSynthesisUtterance(result.short_explanation || result.explanation);
    const langMap = {
      ta: 'ta-IN',
      te: 'te-IN',
      ml: 'ml-IN',
      kn: 'kn-IN',
      hi: 'hi-IN',
      en: 'en-US'
    };
    utterance.lang = langMap[currentLang] || 'en-US';
    window.speechSynthesis.speak(utterance);
  });

  setTimeout(() => {
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.opacity = '0.9';
  }, 100);
}

async function scanPage() {
  const pageText = document.body.innerText.substring(0, 5000);

  try {
    const formData = new FormData();
    formData.append('text', pageText);

    const response = await fetch(`${API_URL}/check/text`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    createOverlay(result);
  } catch (error) {
    console.error('PhishGuard scan error:', error);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scan') {
    scanPage();
  }
});
