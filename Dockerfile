# =========================
# Stage 1: Build Frontend
# =========================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# =========================
# Stage 2: Backend
# =========================
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for OCR
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Render provides PORT automatically
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT}
