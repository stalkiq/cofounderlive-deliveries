FROM node:20-alpine

# Establish application workspace
WORKDIR /app

# Enable standard production flags
ENV NODE_ENV=production
ENV PORT=8080

# Separate package definitions for layer caching
COPY package*.json ./

# Install standard production dependencies
RUN npm ci --only=production

# Copy application files (excluding those in standard dockerignore)
COPY . .

# Expose server listener port
EXPOSE 8080

# Command to boot the Pace Weight Loss Engine
CMD ["npm", "start"]
