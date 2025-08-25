
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