# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package configurations
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application sources
COPY . .

# Expose server listener port
EXPOSE 3000

# Run the collaborative Express service
CMD [ "node", "server.js" ]
