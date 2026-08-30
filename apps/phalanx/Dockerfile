# Production Dockerfile for Phalanx Runtime
FROM node:18-alpine

# Set solid shell security and clean env variables
ENV NODE_ENV=production
WORKDIR /app

# Copy dependency packages for caching layout
COPY package*.json ./
RUN npm ci --only=production

# Copy remaining source code, excluding patterns handled by dockerignore (if any)
COPY . .

# Expose target host port for web dashboards
EXPOSE 3000

# Start server node
CMD ["node", "server.js"]
