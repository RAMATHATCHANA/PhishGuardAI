import os
from pathlib import Path
from fastapi import FastAPI, Form, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import asynccontextmanager
import requests
from dotenv import load_dotenv
from urllib.parse import urlparse
import ipaddress
import socket

from rules import RuleEngine
from utils_qr import decode_qr_from_image
from utils_ocr import extract_text_from_image
from llm_explain import get_explanation
from core_schemas import Base, User, init_sqlite_logs, log_detection, get_stats

load_dotenv()

# Initialize ML model and rule engine
ml_model = None
rule_engine = RuleEngine()

# Initialize SQLite for logs
init_sqlite_logs()

# PostgreSQL setup for user profiles
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
else:
    # Fallback to SQLite for users if PostgreSQL not available
    engine = create_engine('sqlite:///users.db')
    SessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ml_model
    print("Starting PhishGuard API...")
    print("Note: ML model disabled due to environment compatibility issues")
    print("Using rule-based detection only")
    ml_model = None
    yield

app = FastAPI(title="PhishGuard API", lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def is_safe_url(url: str) -> tuple[bool, str, str]:
    """Validate URL to prevent SSRF attacks. Returns (is_safe, reason, validated_ip)"""
    try:
        parsed = urlparse(url)
        
        # Only allow http and https schemes
        if parsed.scheme not in ['http', 'https']:
            return False, "Only HTTP and HTTPS protocols are allowed", ""
        
        # Get hostname
        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid URL: no hostname", ""
        
        # Resolve hostname to IP
        try:
            ip = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(ip)
            
            # Block private/internal IP ranges
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
                return False, "Access to internal/private IP addresses is not allowed", ""
            
            # Block reserved and multicast ranges
            if ip_obj.is_reserved or ip_obj.is_multicast:
                return False, "Access to reserved/multicast IP addresses is not allowed", ""
            
            # Block cloud metadata endpoints
            if ip == "169.254.169.254":
                return False, "Access to cloud metadata endpoints is not allowed", ""
                
        except socket.gaierror:
            return False, "Could not resolve hostname", ""
        
        return True, "OK", ip
    except Exception as e:
        return False, f"URL validation error: {str(e)}", ""

# Health check endpoint for deployment
@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/check/text")
async def check_text(text: str = Form(...)):
    """Analyze text/SMS/email for phishing"""
    try:
        # ML prediction (if available)
        if ml_model:
            ml_result = ml_model.predict(text)
        else:
            ml_result = None
        
        # Rule-based analysis
        rule_reasons = rule_engine.analyze_text(text)
        
        # Combine results
        if ml_result:
            result = rule_engine.combine_results(ml_result, rule_reasons)
        else:
            # Rule-based only
            has_phishing = len(rule_reasons) > 0
            result = {
                'label': 'Phishing' if has_phishing else 'Safe',
                'score': min(0.9, 0.5 + len(rule_reasons) * 0.1) if has_phishing else 0.1,
                'reasons': rule_reasons if rule_reasons else ['No suspicious patterns detected']
            }
        
        # Get LLM explanation
        explanation = get_explanation(text, result['label'], result['score'], result['reasons'])
        
        # Log detection
        log_detection('text', result['label'], result['score'], result['reasons'])
        
        return {
            'label': result['label'],
            'score': result['score'],
            'reasons': result['reasons'],
            'explanation': explanation['detailed'],
            'short_explanation': explanation['short']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check/url")
async def check_url(url: str = Form(...)):
    """Analyze URL and webpage content"""
    try:
        html_content = None
        
        # Validate URL for SSRF protection
        is_safe, reason, validated_ip = is_safe_url(url)
        if not is_safe:
            raise HTTPException(status_code=400, detail=f"Invalid URL: {reason}")
        
        # Try to fetch the URL using validated IP to prevent DNS rebinding
        try:
            parsed = urlparse(url)
            # Replace hostname with validated IP
            ip_url = url.replace(f"//{parsed.hostname}", f"//{validated_ip}")
            
            response = requests.get(
                ip_url, 
                timeout=5, 
                headers={
                    'User-Agent': 'PhishGuard/1.0',
                    'Host': parsed.hostname  # Preserve original hostname for SNI/virtual hosting
                },
                allow_redirects=False  # Prevent redirect-based SSRF bypasses
            )
            html_content = response.text
        except:
            pass
        
        # Analyze URL
        rule_reasons = rule_engine.analyze_url(url, html_content)
        
        # Also analyze URL as text with ML
        ml_result = ml_model.predict(url) if ml_model else None
        
        # Combine results
        if ml_result:
            result = rule_engine.combine_results(ml_result, rule_reasons)
        else:
            # Rule-based only
            has_phishing = len(rule_reasons) > 0
            result = {
                'label': 'Phishing' if has_phishing else 'Safe',
                'score': min(0.9, 0.5 + len(rule_reasons) * 0.1) if has_phishing else 0.1,
                'reasons': rule_reasons if rule_reasons else ['No suspicious patterns detected']
            }
        
        # Get explanation
        explanation = get_explanation(url, result['label'], result['score'], result['reasons'])
        
        # Log detection
        log_detection('url', result['label'], result['score'], result['reasons'])
        
        return {
            'label': result['label'],
            'score': result['score'],
            'reasons': result['reasons'],
            'explanation': explanation['detailed'],
            'short_explanation': explanation['short']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check/qr")
async def check_qr(image: UploadFile = File(...)):
    """Decode and analyze QR code"""
    try:
        image_bytes = await image.read()
        
        # Decode QR
        decoded_text, error = decode_qr_from_image(image_bytes)
        
        if error:
            raise HTTPException(status_code=400, detail=error)
        
        # Analyze decoded content
        rule_reasons = rule_engine.analyze_qr_content(decoded_text)
        ml_result = ml_model.predict(decoded_text) if ml_model else None
        
        if ml_result:
            result = rule_engine.combine_results(ml_result, rule_reasons)
        else:
            # Rule-based only
            has_phishing = len(rule_reasons) > 0
            result = {
                'label': 'Phishing' if has_phishing else 'Safe',
                'score': min(0.9, 0.5 + len(rule_reasons) * 0.1) if has_phishing else 0.1,
                'reasons': rule_reasons if rule_reasons else ['No suspicious patterns detected']
            }
        explanation = get_explanation(decoded_text, result['label'], result['score'], result['reasons'])
        
        # Log detection
        log_detection('qr', result['label'], result['score'], result['reasons'])
        
        return {
            'decoded_text': decoded_text,
            'label': result['label'],
            'score': result['score'],
            'reasons': result['reasons'],
            'explanation': explanation['detailed'],
            'short_explanation': explanation['short']
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check/screenshot")
async def check_screenshot(image: UploadFile = File(...)):
    """Extract text from screenshot and analyze"""
    try:
        image_bytes = await image.read()
        
        # Extract text using OCR
        extracted_text, error = extract_text_from_image(image_bytes)
        
        if error:
            # If OCR fails, return info message
            return {
                'label': 'Unknown',
                'score': 0.5,
                'reasons': [error],
                'explanation': 'Could not analyze screenshot. OCR functionality may not be available.',
                'short_explanation': 'Screenshot analysis unavailable.'
            }
        
        # Analyze extracted text
        rule_reasons = rule_engine.analyze_text(extracted_text)
        ml_result = ml_model.predict(extracted_text) if ml_model else None
        
        if ml_result:
            result = rule_engine.combine_results(ml_result, rule_reasons)
        else:
            # Rule-based only
            has_phishing = len(rule_reasons) > 0
            result = {
                'label': 'Phishing' if has_phishing else 'Safe',
                'score': min(0.9, 0.5 + len(rule_reasons) * 0.1) if has_phishing else 0.1,
                'reasons': rule_reasons if rule_reasons else ['No suspicious patterns detected']
            }
        explanation = get_explanation(extracted_text, result['label'], result['score'], result['reasons'])
        
        # Log detection
        log_detection('screenshot', result['label'], result['score'], result['reasons'])
        
        return {
            'extracted_text': extracted_text[:500],
            'label': result['label'],
            'score': result['score'],
            'reasons': result['reasons'],
            'explanation': explanation['detailed'],
            'short_explanation': explanation['short']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check/voice")
async def check_voice(audio: UploadFile = File(None), text: str = Form(None)):
    """Check voice input (uses transcribed text for demo)"""
    try:
        if text:
            # If text provided (from client-side STT), analyze it
            rule_reasons = rule_engine.analyze_text(text)
            ml_result = ml_model.predict(text) if ml_model else None
            if ml_result:
                result = rule_engine.combine_results(ml_result, rule_reasons)
            else:
                # Rule-based only
                has_phishing = len(rule_reasons) > 0
                result = {
                    'label': 'Phishing' if has_phishing else 'Safe',
                    'score': min(0.9, 0.5 + len(rule_reasons) * 0.1) if has_phishing else 0.1,
                    'reasons': rule_reasons if rule_reasons else ['No suspicious patterns detected']
                }
            explanation = get_explanation(text, result['label'], result['score'], result['reasons'])
            
            log_detection('voice', result['label'], result['score'], result['reasons'])
            
            return {
                'label': result['label'],
                'score': result['score'],
                'reasons': result['reasons'],
                'explanation': explanation['detailed'],
                'short_explanation': explanation['short']
            }
        else:
            return {
                'label': 'Unknown',
                'score': 0.5,
                'reasons': ['Voice processing not implemented'],
                'explanation': 'Please use client-side speech recognition.',
                'short_explanation': 'Voice input received but not processed.'
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
def get_statistics():
    """Get detection statistics for dashboard"""
    try:
        stats = get_stats()
        
        # Format for frontend
        type_counts = {}
        for dtype, count, label in stats['type_counts']:
            if dtype not in type_counts:
                type_counts[dtype] = {'Safe': 0, 'Phishing': 0}
            type_counts[dtype][label] = count
        
        user_groups = {designation: count for designation, count in stats['user_stats']}
        
        recent = [{
            'timestamp': log[0],
            'type': log[1],
            'label': log[2],
            'score': log[3],
            'reasons': log[4].split('||') if log[4] else []
        } for log in stats['recent_logs']]
        
        return {
            'type_counts': type_counts,
            'user_groups': user_groups,
            'recent_logs': recent
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/register")
async def register_user(
    name: str = Form(...),
    email: str = Form(...),
    gender: str = Form(...),
    age_group: str = Form(...),
    designation: str = Form(...)
):
    """Register or update user profile"""
    try:
        db = SessionLocal()
        
        # Check if user exists
        existing_user = db.query(User).filter(User.email == email).first()
        
        if existing_user:
            # Update existing user
            existing_user.name = name
            existing_user.gender = gender
            existing_user.age_group = age_group
            existing_user.designation = designation
        else:
            # Create new user
            new_user = User(
                name=name,
                email=email,
                gender=gender,
                age_group=age_group,
                designation=designation
            )
            db.add(new_user)
        
        db.commit()
        db.close()
        
        return {"message": "User registered successfully", "email": email}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/profile/{email}")
async def get_user_profile(email: str):
    """Get user profile by email"""
    try:
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        db.close()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            'name': user.name,
            'email': user.email,
            'gender': user.gender,
            'age_group': user.age_group,
            'designation': user.designation,
            'created_at': str(user.created_at)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serve static frontend files (for deployment)
static_dir = Path(__file__).parent.parent / "frontend" / "dist"
if static_dir.exists() and (static_dir / "index.html").exists():
    # Mount assets directory for static files
    if (static_dir / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve frontend or fallback to index.html for SPA routing"""
        # Skip if it's an API endpoint - let other routes handle it
        if (full_path.startswith("check/") or full_path.startswith("users/") or 
            full_path == "stats" or full_path == "health"):
            raise HTTPException(status_code=404)
        
        # Try to serve the requested file
        if full_path:
            file_path = static_dir / full_path
            if file_path.is_file():
                return FileResponse(file_path)
        
        # Fallback to index.html for root and SPA routes
        return FileResponse(static_dir / "index.html")
else:
    # If frontend not built, provide API info at root
    @app.get("/")
    def root():
        return {"message": "PhishGuard API is running", "version": "1.0.0", "status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('PORT', 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
