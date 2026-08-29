# Use official Node.js active LTS alpine image for minimal footprint
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install clean production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy project files and sources
COPY server.js ./
COPY src/ ./src/
COPY public/ ./public/

# Create memory directory file holder and assign Node user ownership
RUN mkdir -p /app/data && chown -R node:node /app

# Declare a volume mount point to persist the Socratic dialogue database
VOLUME [ "/app/data" ]

# Toggle user context for improved security
USER node

# Expose server port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Start server node
CMD [ "node", "server.js" ]
