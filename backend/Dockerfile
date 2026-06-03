FROM node:20-slim

WORKDIR /app

# openssl requerido por Prisma en Debian slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Instalar dependencias primero (capa cacheada)
COPY package*.json ./
RUN npm ci --only=production

# Copiar schema y generar cliente Prisma
COPY prisma ./prisma/
RUN npx prisma generate

# Copiar código fuente y seed
COPY src ./src/
COPY seed.js ./

# Script de arranque — convertir CRLF→LF por si se editó en Windows
COPY entrypoint.sh ./
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
