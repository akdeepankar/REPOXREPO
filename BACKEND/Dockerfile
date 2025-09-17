FROM python:3.12-slim

# Install system dependencies for OCR and PDF
RUN apt-get update && \
    apt-get install -y tesseract-ocr poppler-utils && \
    rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose port (Azure uses PORT env variable)
ENV PORT=8000
EXPOSE 8000

# Set environment variables for Flask
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Start with Gunicorn for production
CMD ["gunicorn", "main:app", "--bind", "0.0.0.0:8000"]
