FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Added python3-dev and extra ssl headers
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Ensure we are copying from the correct path relative to the Backend folder
COPY App/requirements.txt .

# Upgrade pip and install
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY App/ .

EXPOSE 8000