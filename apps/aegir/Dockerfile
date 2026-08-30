# Use lightweight official Node JS release
FROM node:20-slim

# Configure production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Set operations workspace location
WORKDIR /app

# Only copy dependency manifests first to optimize layer caching
COPY package*.json ./

# Install standard production dependencies
RUN npm ci --only=production

# Copy remaining source files including public interface sheets
COPY . .

# Expose default HTTP socket
EXPOSE 3000

# Command to execute Node.js Express telemetry backend
CMD ["npm", "start"]
