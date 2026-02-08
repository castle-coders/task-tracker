# /backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if needed (e.g. for mysqlclient)
RUN apt-get update && apt-get install -y default-libmysqlclient-dev build-essential pkg-config

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend files into a 'backend' subdirectory so module resolution works
COPY . ./backend/

# Set Python path to current directory so 'from backend...' works
ENV PYTHONPATH=/app

# Expose Flask port
EXPOSE 5000

# Run with Gunicorn, referencing the app factory in the backend package
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "backend.app:create_app()"]
