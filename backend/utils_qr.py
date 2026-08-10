import cv2
import numpy as np
from io import BytesIO

def decode_qr_from_image(image_bytes):
    """Decode QR code from image bytes with robust preprocessing"""
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None, "Failed to load image"
        
        # Initialize QR code detector
        qr_detector = cv2.QRCodeDetector()
        
        # Method 1: Try on original image
        data, bbox, _ = qr_detector.detectAndDecode(img)
        if data:
            return data, None
        
        # Method 2: Convert to grayscale and try
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        data, bbox, _ = qr_detector.detectAndDecode(gray)
        if data:
            return data, None
        
        # Method 3: Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        data, bbox, _ = qr_detector.detectAndDecode(thresh)
        if data:
            return data, None
        
        # Method 4: Try with binary threshold
        _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        data, bbox, _ = qr_detector.detectAndDecode(binary)
        if data:
            return data, None
        
        # Method 5: Apply bilateral filter to reduce noise
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)
        data, bbox, _ = qr_detector.detectAndDecode(filtered)
        if data:
            return data, None
        
        # Method 6: Try resizing image (sometimes helps with small/large QR codes)
        height, width = gray.shape
        for scale in [0.5, 2.0, 1.5]:
            resized = cv2.resize(gray, (int(width * scale), int(height * scale)))
            data, bbox, _ = qr_detector.detectAndDecode(resized)
            if data:
                return data, None
        
        # If all methods fail
        return None, "No QR code detected in image"
    
    except Exception as e:
        return None, f"Error decoding QR code: {str(e)}"
