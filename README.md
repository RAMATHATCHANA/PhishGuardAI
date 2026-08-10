# PhishGuard 🛡️

A comprehensive multi-surface phishing detection application with AI-powered analysis, multilingual support, and voice assistance.

## 🚀 Features

### Multi-Surface Detection
- **Text/SMS/Email Analysis**: Detect phishing in messages
- **URL Scanning**: Analyze links and web pages with form detection
- **QR Code Analysis**: Decode and check QR codes for malicious content
- **Screenshot Analysis**: Extract and analyze text from images (OCR)
- **Voice Input**: Speech-to-text phishing detection

### AI & ML Powered
- **Machine Learning**: TF-IDF + Logistic Regression classifier
- **Rule-Based Engine**: Keyword detection, domain analysis, URL validation
- **LLM Explanations**: Hugging Face API integration with fallback templates
- **Training Dataset**: 200+ phishing and legitimate samples

### Multilingual Support
- 6 Languages: English, Tamil, Telugu, Malayalam, Kannada, Hindi
- Complete UI translation (all visible strings)
- Multilingual TTS voice output (ta-IN, te-IN, ml-IN, kn-IN, hi-IN, en-US)

### Voice Assistant
- Web Speech API for STT (Speech-to-Text)
- Multilingual TTS (Text-to-Speech)
- Language-aware voice output

### Analytics Dashboard
- Bar charts: Detection by channel (Email, SMS, QR, Forms, Social)
- User activity by group (students, professionals, etc.)
- Detection heatmap visualization
- Recent scans table with scores

### Browser Extension
- Chrome Manifest V3 extension
- Real-time page scanning
- Multilingual overlay alerts
- TTS explanation support

## 📋 Tech Stack

### Backend
- Python 3.11
- FastAPI + Uvicorn
- scikit-learn (ML)
- PostgreSQL (user profiles)
- SQLite (detection logs)
- OpenCV (QR detection)
- Hugging Face Inference API

### Frontend
- React 18
- Vite
- Tailwind CSS 3.4.x
- react-i18next (i18n)
- recharts (visualizations)
- Web Speech API

## 🔧 Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL (optional, falls back to SQLite)

### Quick Start

1. **Install Dependencies**:
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

2. **Environment Variables**:
Create `backend/.env`:
```
DATABASE_URL=postgresql://user:pass@localhost/phishguard
HUGGINGFACE_API_KEY=your_hf_api_key_here
HF_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.2
```

3. **Train ML Model**:
```bash
cd backend
python -c "from model import PhishingModel; m = PhishingModel(); m.train()"
```

4. **Run Application**:

**Option A - Separate Terminals**:
```bash
# Terminal 1 - Backend
cd backend
uvicorn app:app --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Option B - Single Script**:
```bash
./start.sh
```

5. **Access Application**:
- Frontend: http://localhost:5000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🎯 Usage Guide

### Login
1. Enter your name, email, gender, age category, and designation
2. Data is stored in PostgreSQL for profile management

### Text Analysis
1. Navigate to "Scan" page
2. Paste text in the large text box (top left)
3. Click "Analyze Text"
4. View results with confidence score, reasons, and explanation
5. Click "Speak Explanation" for voice output

### URL Analysis
1. Enter URL in the URL input field
2. Click "Analyze URL"
3. System fetches and analyzes page content including forms

### QR Code / Screenshot
1. Upload image file (bottom left upload box)
2. Click "Analyze File"
3. System decodes QR or extracts text via OCR

### Voice Assistant
1. Click "Start Listening"
2. Speak your message
3. System transcribes and analyzes
4. Results shown with TTS explanation

### Educational Modules
1. Navigate to "Learn" page
2. Browse 6 awareness modules
3. Watch videos with multilingual captions

### Analytics Dashboard
1. Navigate to "Trends" page
2. View detection statistics by channel
3. See user group activity
4. Review recent scans table

## 🌐 Chrome Extension

### Installation
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Extension icon appears in toolbar

### Usage
1. Click extension icon
2. Select preferred language
3. Click "Scan This Page"
4. View overlay with results
5. Click "Read Aloud" for TTS

## 📊 API Endpoints

### Detection Endpoints
- `POST /check/text` - Analyze text/SMS/email
- `POST /check/url` - Analyze URL and webpage
- `POST /check/qr` - Decode and analyze QR code
- `POST /check/screenshot` - OCR and analyze image
- `POST /check/voice` - Analyze voice input

### User Management
- `POST /users/register` - Register/update user
- `GET /users/profile/{email}` - Get user profile

### Analytics
- `GET /stats` - Get detection statistics

## 🔐 Security & Privacy

- Local PostgreSQL for user data
- SQLite for detection logs
- No PII in logs (optional lat/lon only)
- API keys managed via environment variables
- CORS configured for local development

## 🎨 Customization

### Add Training Data
Add samples to `backend/data/sample_phish.csv`:
```csv
text,label
"Your message here",1
"Safe message",0
```
Then retrain: `python -c "from model import PhishingModel; m = PhishingModel(); m.train()"`

### Configure LLM
Set `HUGGINGFACE_API_KEY` and `HF_MODEL_ID` in `.env` for better explanations.
Falls back to template-based if not configured.

### Add Languages
1. Add translations to `frontend/src/i18n.js`
2. Add TTS language codes to voice assistant
3. Add to extension `languages.json`

## 🧪 Testing

### Manual Testing
1. Test phishing SMS: "URGENT: Your account suspended. Click: bit.ly/verify123"
2. Test safe message: "Meeting at 3 PM in conference room"
3. Upload QR code with URL
4. Test voice input in different languages

### Expected Results
- Phishing samples: Score > 60%, red warning
- Safe samples: Score < 40%, green checkmark
- Reasons listed for each detection
- Multilingual UI updates on language change

## 📝 Project Structure

```
phishguard/
├── backend/
│   ├── app.py                 # FastAPI application
│   ├── model.py               # ML model (TF-IDF + LogReg)
│   ├── rules.py               # Rule-based engine
│   ├── llm_explain.py         # LLM explanations
│   ├── utils_qr.py            # QR decoding
│   ├── utils_ocr.py           # OCR extraction
│   ├── core_schemas.py        # Database schemas
│   ├── data/sample_phish.csv  # Training data
│   ├── models/                # ML artifacts
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/             # React pages
│   │   ├── components/        # React components
│   │   ├── i18n.js           # Translations
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.mjs
├── extension/
│   ├── manifest.json          # Chrome extension config
│   ├── content.js             # Content script
│   ├── popup.html             # Extension popup
│   └── popup.js
└── start.sh                   # Startup script
```

## 🤝 Contributing

### Adding More Training Data
Recommended datasets:
- PhishTank (URLs)
- SMS Spam Collection
- Email phishing datasets

### Improving Accuracy
1. Add more diverse training samples
2. Tune ML hyperparameters
3. Enhance rule-based patterns
4. Integrate additional features (sender validation, etc.)

## 📄 License

This project is created for hackathon demonstration purposes.

## 🙏 Acknowledgments

- Hugging Face for LLM API
- OpenCV for QR detection
- scikit-learn for ML capabilities
- React and Vite communities

## 📧 Support

For issues or questions, please check the logs:
- Backend: Check terminal or `/tmp/logs/Backend_*.log`
- Frontend: Check browser console
- Extension: Check Chrome DevTools

---

Built with ❤️ for PhishGuard Hackathon
