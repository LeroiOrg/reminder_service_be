FROM node:18-alpine

# Directorio de trabajo
WORKDIR /app
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

COPY . .

# Exponer puerto
EXPOSE 8006

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=8006

CMD ["npm", "start"]
