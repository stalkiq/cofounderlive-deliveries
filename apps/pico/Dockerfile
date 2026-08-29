# Production-ready Node Dockerfile
FROM node:20-alpine

# Set proper work environment 
WORKDIR /app

# Copy dependency mappings
COPY package*.json ./

# Install clean production dependencies
RUN npm ci --only=production

# Copy remaining code files
COPY . .

# Expose port (default Node port 3000 as configured in server)
EXPOSE 3000

# Set Node production runtime mode flags
ENV NODE_ENV=production

# Launch Pico sandbox engine
CMD ["npm", "start"]
