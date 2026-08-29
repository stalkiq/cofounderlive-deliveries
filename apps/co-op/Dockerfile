# Use lightweight, safe Node.js base image
FROM node:18-alpine

# Setup app directory 
WORKDIR /usr/src/app

# Copy dependency files first
COPY package*.json ./

# Install execution dependencies
RUN npm install --omit=dev

# Copy rest of application code index, server and seeds
COPY . .

# Expose server port 
EXPOSE 3000

# Set environment
ENV PORT=3000
ENV NODE_ENV=production

# Boot server
CMD ["node", "server.js"]
```
