FROM python:3.11-slim

# Set environment agar Python tidak buffer output (penting untuk Docker logs)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies terlebih dahulu untuk memanfaatkan Docker layer cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code aplikasi
COPY . .

EXPOSE 5000

# Jalankan dengan Gunicorn: 4 worker, bind ke semua interface di port 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "--timeout", "120", "run:app"]
