# Dockerfile.backend
FROM node:20-alpine

# Crear y usar directorio de trabajo
WORKDIR /app

# Copiar dependencias y luego código
COPY package*.json ./
RUN npm install

COPY . .

# Exponer el puerto de la app (ej. 3000)
EXPOSE 3000

# Iniciar el servidor
CMD ["npm", "run", "dev"]
