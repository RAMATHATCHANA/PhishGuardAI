import re
from urllib.parse import urlparse

class RuleEngine:
    def __init__(self):
        self.phishing_keywords = [
            'urgent', 'verify', 'suspended', 'locked', 'confirm', 'update',
            'click here', 'act now', 'limited time', 'expire', 'immediate',
            'account', 'security', 'alert', 'warning', 'problem', 'unauthorized',
            'verify your', 'confirm your', 'update your', 'click now',
            'congratulations', 'winner', 'prize', 'claim', 'free', 'gift',
            'password', 'otp', 'reset', 'bank', 'credit card', 'paypal',
            'social security', 'ssn', 'tax', 'refund', 'irs', 'government'
        ]
        
        self.url_shorteners = [
            'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
            'is.gd', 'buff.ly', 'adf.ly', 'short.link'
        ]
        
        self.trusted_domains = [
            'google.com', 'microsoft.com', 'apple.com', 'amazon.com',
            'facebook.com', 'twitter.com', 'linkedin.com', 'github.com'
        ]
    
    def analyze_text(self, text):
        """Analyze text for phishing indicators"""
        reasons = []
        text_lower = text.lower()
        
        # Check for urgent/suspicious keywords
        found_keywords = [kw for kw in self.phishing_keywords if kw in text_lower]
        if len(found_keywords) >= 3:
            reasons.append(f"Multiple suspicious keywords detected: {', '.join(found_keywords[:3])}")
        elif len(found_keywords) >= 1:
            reasons.append(f"Suspicious keywords found: {', '.join(found_keywords)}")
        
        # Check for URL shorteners
        for shortener in self.url_shorteners:
            if shortener in text_lower:
                reasons.append(f"URL shortener detected: {shortener}")
                break
        
        # Check message length (very short messages with links are suspicious)
        if len(text.split()) < 20 and ('http' in text_lower or 'www.' in text_lower):
            reasons.append("Short message with embedded link")
        
        # Check for excessive punctuation/caps
        if text.count('!') >= 3:
            reasons.append("Excessive exclamation marks")
        
        caps_count = sum(1 for c in text if c.isupper())
        if caps_count > len(text) * 0.3 and len(text) > 20:
            reasons.append("Excessive use of capital letters")
        
        # Check for IP addresses in URLs
        if re.search(r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', text):
            reasons.append("URL contains IP address instead of domain name")
        
        return reasons
    
    def analyze_url(self, url, html_content=None):
        """Analyze URL for phishing indicators"""
        reasons = []
        
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Check for suspicious TLDs
            suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top']
            if any(domain.endswith(tld) for tld in suspicious_tlds):
                reasons.append(f"Suspicious top-level domain in URL")
            
            # Check for subdomain spoofing
            if domain.count('.') >= 3:
                reasons.append("Multiple subdomains detected (possible spoofing)")
            
            # Check for common brand name in suspicious domain
            brands = ['paypal', 'amazon', 'microsoft', 'apple', 'google', 'facebook', 'bank']
            for brand in brands:
                if brand in domain and not any(trusted in domain for trusted in self.trusted_domains):
                    reasons.append(f"Brand name '{brand}' in non-official domain")
                    break
            
            # Check for @ symbol in URL (username phishing)
            if '@' in url:
                reasons.append("@ symbol in URL (possible redirect)")
            
            # Check for excessive hyphens
            if domain.count('-') >= 3:
                reasons.append("Excessive hyphens in domain name")
            
            # Analyze HTML content if provided
            if html_content:
                html_lower = html_content.lower()
                
                # Check for forms with suspicious action
                form_pattern = r'<form[^>]*action=["\']([^"\']+)["\']'
                forms = re.findall(form_pattern, html_lower)
                for form_action in forms:
                    if form_action.startswith('http') and parsed.netloc not in form_action:
                        reasons.append(f"Form submits to different domain: {form_action[:50]}")
                        break
                
                # Check for password fields
                if '<input' in html_lower and ('type="password"' in html_lower or "type='password'" in html_lower):
                    reasons.append("Page contains password input fields")
                
                # Check for hidden iframes
                if '<iframe' in html_lower and 'hidden' in html_lower:
                    reasons.append("Hidden iframe detected")
        
        except Exception as e:
            reasons.append(f"Error parsing URL: {str(e)}")
        
        return reasons
    
    def analyze_qr_content(self, decoded_text):
        """Analyze QR code content"""
        reasons = []
        
        # Check if it's a URL
        if decoded_text.startswith('http://') or decoded_text.startswith('https://'):
            reasons.extend(self.analyze_url(decoded_text))
        
        # Also analyze as text
        text_reasons = self.analyze_text(decoded_text)
        reasons.extend(text_reasons)
        
        return reasons
    
    def combine_results(self, ml_result, rule_reasons):
        """Combine ML prediction with rule-based reasons"""
        all_reasons = rule_reasons.copy()
        
        # Add ML-based reason
        if ml_result['label'] == 'Phishing':
            confidence = ml_result['score'] * 100
            all_reasons.insert(0, f"ML model detected phishing patterns (confidence: {confidence:.1f}%)")
        
        # If we have multiple strong signals, boost confidence
        if len(rule_reasons) >= 3 and ml_result['score'] > 0.4:
            ml_result['label'] = 'Phishing'
            ml_result['score'] = min(ml_result['score'] * 1.2, 0.99)
        
        # If no rules triggered but ML says phishing, add generic reason
        if len(rule_reasons) == 0 and ml_result['label'] == 'Phishing':
            all_reasons.append("Content pattern matches known phishing templates")
        
        return {
            'label': ml_result['label'],
            'score': ml_result['score'],
            'reasons': all_reasons if all_reasons else ['No suspicious indicators found']
        }
