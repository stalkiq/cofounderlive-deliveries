# Define lightweight, production-grade base image
FROM node:20-alpine

# Establish isolated workspace directory
WORKDIR /app

# Copy essential package scripts
COPY package*.json ./

# Install production dependencies cleanly (excluding dev dependencies on live runtime)
RUN npm ci --only=production

# Copy primary deployment codes
COPY server.js ./
COPY public/ ./public/
COPY scripts/ ./scripts/

# Declare default operating PORT mapped inside Express settings
EXPOSE 3000

# Set environment parameters
ENV NODE_ENV=production
ENV PORT=3000

# Initiate Gantry Operational Executor Engine
CMD ["node", "server.js"]
