# FROM python:3.13-slim

# # Instalación de dependencias del sistema
# RUN apt-get update && apt-get install -y \
#     wget gnupg curl unzip fonts-liberation libnss3 libatk-bridge2.0-0 \
#     libgtk-3-0 libxss1 libasound2 libx11-xcb1 libxcb1 xvfb \
#     && apt-get clean && rm -rf /var/lib/apt/lists/*

# # Instalación de dependencias de Python y Playwright
# RUN pip install --upgrade pip
# COPY requirements.txt .
# RUN pip install -r requirements.txt
# RUN playwright install --with-deps

# # Copia del código fuente
# WORKDIR /app
# COPY . .

# # Permisos de ejecución para el script
# RUN chmod +x /app/run.sh

# # Punto de entrada
# ENTRYPOINT ["/app/run.sh"]

# Usa la imagen oficial de Playwright para Python
FROM mcr.microsoft.com/playwright/python:v1.54.0

WORKDIR /app

# Instala tus dependencias
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copia el código fuente
COPY . .

# Permisos de ejecución para el script
RUN chmod +x /app/run.sh

# Punto de entrada
ENTRYPOINT ["/app/run.sh"]