# Use lightweight LTS Node image
FROM node:18-slim

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Create app workdir
WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Bundle remaining codebase source files (server, directories, public config)
COPY . .

# Expose server port
EXPOSE 3000

# Start server.js application execution
CMD [ "node", "server.js" ]
