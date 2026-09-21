# Use lightweight official Node 20 alpine image
FROM node:20-alpine

# Set non-root container environment settings
ENV NODE_ENV=production
WORKDIR /app

# Copy dependency graphs and install
COPY package*.json ./
RUN npm ci --omit=dev

# Copy all application assets and codes
COPY . .

# Setup local storage directory permissions
RUN mkdir -p /tmp/ag-ep_mubffxrc-otkR1E/data && chown -R node:node /tmp/ag-ep_mubffxrc-otkR1E

# Expose standard server listening port
EXPOSE 3000

# Downgrade permissions to standard non-root user
USER node

# Execute runtime launch trigger
CMD ["npm", "start"]
