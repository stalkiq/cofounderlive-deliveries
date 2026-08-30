# Use stable LTS lightweight Node Alpine base image
FROM node:18-alpine

# Set target application directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install only essential production dependencies
RUN npm ci --only=production

# Copy remaining source code files (including asset assets and db folders)
COPY . .

# Ensure non-root node user manages process safety in container pipelines
RUN chown -R node:node /usr/src/app
USER node

# Expose standard default web server port
EXPOSE 3000

# Start Express.js Web Server
CMD ["node", "server.js"]
