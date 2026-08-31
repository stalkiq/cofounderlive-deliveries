# Use high compatibility lightweight Node.js base
FROM node:20-alpine

# Set non-interactive and production mode
ENV NODE_ENV=production
ENV PORT=3000

# Set application home directory
WORKDIR /usr/src/app

# Copy application manifest files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy remaining source code of server and assets
COPY . .

# Expose standard port
EXPOSE 3000

# Run Express server directly
CMD ["node", "server.js"]
