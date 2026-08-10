import os
import requests
from typing import Dict

class LLMExplainer:
    def __init__(self):
        self.api_key = os.getenv('HUGGINGFACE_API_KEY', '')
        self.model_id = os.getenv('HF_MODEL_ID', 'mistralai/Mistral-7B-Instruct-v0.2')
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_id}"
    
    def generate_explanation(self, text: str, label: str, score: float, reasons: list) -> Dict[str, str]:
        """Generate both short (spoken) and detailed explanations"""
        
        # Create prompt
        reasons_text = '; '.join(reasons[:3]) if reasons else 'pattern analysis'
        
        prompt = f"""Analyze this message and provide TWO explanations:

Message: "{text[:200]}"
Classification: {label}
Confidence: {score*100:.1f}%
Indicators: {reasons_text}

1. SHORT (1-2 sentences for voice): A brief spoken explanation
2. DETAILED (2-3 sentences): A comprehensive written breakdown

Format:
SHORT: [your short explanation]
DETAILED: [your detailed explanation]"""

        # Try Hugging Face API if key available
        if self.api_key:
            try:
                response = requests.post(
                    self.api_url,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "inputs": prompt,
                        "parameters": {
                            "max_new_tokens": 200,
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "do_sample": True
                        }
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, list) and len(result) > 0:
                        generated = result[0].get('generated_text', '')
                        return self._parse_response(generated)
            except Exception as e:
                print(f"LLM API error: {e}")
        
        # Fallback to template-based explanation
        return self._generate_fallback(label, score, reasons)
    
    def _parse_response(self, generated: str) -> Dict[str, str]:
        """Parse LLM response into short and detailed explanations"""
        try:
            if 'SHORT:' in generated and 'DETAILED:' in generated:
                parts = generated.split('DETAILED:')
                short = parts[0].split('SHORT:')[1].strip()
                detailed = parts[1].strip()
                return {'short': short, 'detailed': detailed}
        except:
            pass
        
        # If parsing fails, use the whole response
        lines = generated.strip().split('\n')
        relevant = [l for l in lines if l.strip() and not l.strip().startswith('Message:')]
        text = ' '.join(relevant[:3])
        return {'short': text[:150], 'detailed': text}
    
    def _generate_fallback(self, label: str, score: float, reasons: list) -> Dict[str, str]:
        """Generate template-based explanation when API unavailable"""
        
        if label == 'Phishing':
            if score > 0.8:
                short = f"This appears to be a phishing attempt with {len(reasons)} red flags detected."
                detailed = f"Our analysis identified this as highly suspicious phishing content. Key indicators include: {', '.join(reasons[:2])}. Do not click any links or provide personal information."
            elif score > 0.6:
                short = f"This message shows signs of phishing with moderate confidence."
                detailed = f"Several phishing indicators were detected: {', '.join(reasons[:2])}. Exercise caution and verify the sender's authenticity before taking any action."
            else:
                short = "This message has some suspicious characteristics that suggest it might be phishing."
                detailed = f"While not definitively malicious, this message exhibits concerning patterns: {', '.join(reasons[:2])}. Verify with the official organization through known channels."
        else:
            short = "This message appears to be legitimate with no significant red flags."
            detailed = f"Our analysis found this content to be safe. {reasons[0] if reasons else 'No suspicious patterns were detected'}. However, always remain vigilant with unexpected messages."
        
        return {
            'short': short,
            'detailed': detailed
        }

def get_explanation(text: str, label: str, score: float, reasons: list) -> Dict[str, str]:
    """Convenience function to get explanation"""
    explainer = LLMExplainer()
    return explainer.generate_explanation(text, label, score, reasons)
