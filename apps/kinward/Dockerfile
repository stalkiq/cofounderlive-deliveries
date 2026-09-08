# Use high performance, lightweight alpine node image
FROM node:20-alpine

# Set running context
WORKDIR /app

# Ensure configuration is cached for fast builds
COPY package.json ./

# Install clean production modules
RUN npm install --only=production

# Copy application resources
COPY server.js ./
COPY public/ ./public/
COPY scripts/ ./scripts/

# Ensure directory for durable database holds proper access permissions
RUN mkdir -p /app/data

# Default server listening port
EXPOSE 3000

# Execute server bootstrapper
CMD ["npm", "start"]
