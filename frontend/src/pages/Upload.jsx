import { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

// Use relative URLs - Vite proxy will forward to backend
const API_URL = "";

const Upload = () => {
  const { t, i18n } = useTranslation();
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const analyzeText = async () => {
    if (!textContent.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("text", textContent);
      const response = await axios.post(`${API_URL}/check/text`, formData);
      setResult(response.data);
    } catch (error) {
      console.error("Error:", error);
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const analyzeUrl = async () => {
    if (!urlContent.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("url", urlContent);
      const response = await axios.post(`${API_URL}/check/url`, formData);
      setResult(response.data);
    } catch (error) {
      console.error("Error:", error);
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const analyzeFile = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      let response;
      
      try {
        response = await axios.post(`${API_URL}/check/qr`, formData);
      } catch (qrError) {
        if (qrError.response?.status === 400) {
          response = await axios.post(`${API_URL}/check/screenshot`, formData);
        } else {
          throw qrError;
        }
      }
      
      setResult(response.data);
    } catch (error) {
      console.error("Error:", error);
      alert("Analysis failed. Please ensure the image contains a QR code or readable text.");
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Speech recognition not supported");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userName = user.name || "User";
    
    const langMap = {
      ta: "ta-IN",
      te: "te-IN",
      ml: "ml-IN",
      kn: "kn-IN",
      hi: "hi-IN",
      en: "en-US",
    };

    const greetings = {
      ta: `வணக்கம் ${userName}, நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன். தயவுசெய்து பேசுங்கள்`,
      te: `నమస్కారం ${userName}, నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను. దయచేసి మాట్లాడండి`,
      ml: `നമസ്കാരം ${userName}, ഞാൻ നിങ്ങളെ സഹായിക്കാൻ ഇവിടെയുണ്ട്. ദയവായി സംസാരിക്കുക`,
      kn: `ನಮಸ್ಕಾರ ${userName}, ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ಮಾತನಾಡಿ`,
      hi: `नमस्ते ${userName}, मैं आपकी मदद के लिए यहाँ हूँ। कृपया बोलें`,
      en: `Hello ${userName}, I'm here to help you. Please speak`
    };
    
    const greeting = greetings[i18n.language] || greetings.en;
    
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(greeting);
      utterance.lang = langMap[i18n.language] || "en-US";
      
      utterance.onend = () => {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = langMap[i18n.language] || "en-US";
        recognition.continuous = false;

        recognition.onstart = () => setIsListening(true);
        
        recognition.onend = () => setIsListening(false);

        recognition.onresult = async (event) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          setLoading(true);

          try {
            const formData = new FormData();
            formData.append("text", text);
            const response = await axios.post(`${API_URL}/check/voice`, formData);
            setResult(response.data);
            
            const responseText = response.data.short_explanation || response.data.explanation;
            if ("speechSynthesis" in window && responseText) {
              const responseUtterance = new SpeechSynthesisUtterance(responseText);
              responseUtterance.lang = langMap[i18n.language] || "en-US";
              window.speechSynthesis.speak(responseUtterance);
            }
          } catch (error) {
            console.error("Error:", error);
            alert("Voice analysis failed. Please try again.");
          } finally {
            setLoading(false);
          }
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          alert(`Voice recognition error: ${event.error}`);
        };

        recognition.start();
      };
      
      setIsListening(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech not supported");
    }
  };

  const speakExplanation = (text) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech not supported");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    const langMap = {
      ta: "ta-IN",
      te: "te-IN",
      ml: "ml-IN",
      kn: "kn-IN",
      hi: "hi-IN",
      en: "en-US",
    };

    utterance.lang = langMap[i18n.language] || "en-US";

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) =>
      v.lang.startsWith(utterance.lang.split("-")[0]),
    );
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {t("upload_title")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t("text_analysis")}
            </h2>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={t("text_placeholder")}
              className="input-field h-32 resize-none mb-4"
            />
            <button
              onClick={analyzeText}
              className="btn-primary w-full"
              disabled={loading}
            >
              {t("btn_analyze_text")}
            </button>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              URL Analysis
            </h2>
            <input
              type="text"
              value={urlContent}
              onChange={(e) => setUrlContent(e.target.value)}
              placeholder={t("url_placeholder")}
              className="input-field mb-4"
            />
            <button
              onClick={analyzeUrl}
              className="btn-primary w-full"
              disabled={loading}
            >
              {t("btn_analyze_url")}
            </button>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t("file_upload")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t("upload_qr")}
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="input-field mb-4"
            />
            {file && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Selected: {file.name}
              </p>
            )}
            <button
              onClick={analyzeFile}
              className="btn-primary w-full"
              disabled={loading || !file}
            >
              {t("btn_analyze_file")}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t("voice_assistant")}
            </h2>
            <button
              onClick={startListening}
              className={`w-full py-3 rounded-lg mb-4 transition-colors ${
                isListening
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-primary-600 hover:bg-primary-700 text-white"
              }`}
            >
              {isListening ? t("stop_listening") : t("start_listening")} 🎤
            </button>
            {transcript && (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {transcript}
                </p>
              </div>
            )}
          </div>

          {result && (
            <div className="card">
              <div
                className={`flex items-center space-x-2 mb-4 ${
                  result.label === "Safe" ? "text-green-600" : "text-red-600"
                }`}
              >
                <span className="text-2xl">
                  {result.label === "Safe" ? "✅" : "⚠️"}
                </span>
                <span className="text-xl font-bold">
                  {result.label === "Safe"
                    ? t("result_safe")
                    : t("result_phishing")}
                </span>
              </div>

              <div className="mb-4">
                <p className="font-semibold mb-2 text-gray-900 dark:text-white">
                  {t("reasons")}:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  {result.reasons?.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <p className="font-semibold mb-2 text-gray-900 dark:text-white">
                  {t("explanation")}:
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {result.explanation}
                </p>
              </div>

              <button
                onClick={() =>
                  speakExplanation(
                    result.short_explanation || result.explanation,
                  )
                }
                className="btn-secondary w-full"
              >
                {t("speak_explanation")} 🔊
              </button>
            </div>
          )}

          {loading && (
            <div className="card text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">{t("loading")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
