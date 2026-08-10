import cv2
import numpy as np

def extract_text_from_image(image_bytes):
    """Extract text from image using OCR (optional - requires pytesseract)"""
    try:
        import pytesseract
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None, "Failed to load image"
        
        # Extract text
        text = pytesseract.image_to_string(img)
        
        if text.strip():
            return text.strip(), None
        else:
            return None, "No text detected in image"
    
    except ImportError:
        return None, "OCR not available (pytesseract not installed)"
    except Exception as e:
        return None, f"Error extracting text: {str(e)}"
