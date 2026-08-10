#!/bin/bash
set -e

echo "🛡️ Starting PhishGuard Application..."

# Backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -q -r requirements.txt

cd ..

# Frontend build (if not already built)
if [ ! -d "frontend/dist" ]; then
  echo "📦 Building frontend..."
  cd frontend
  npm install --silent
  npm run build
  cd ..
fi

# Start backend (ML model loads via FastAPI lifespan)
echo "🚀 Starting server on port 5000..."
cd backend
exec uvicorn app:app --host 0.0.0.0 --port 5000
