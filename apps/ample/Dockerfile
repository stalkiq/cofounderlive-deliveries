# Use standard stable Node.js runtime as parent image
FROM node:20-slim

# Set working directory inside container
WORKDIR /app

# Copy package configurations first to benefit from Layer Caching
COPY package*.json ./

# Install standard dependencies
RUN npm ci --omit=dev

# Copy entire client UI and server application files
COPY . .

# Expose default HTTP Port
EXPOSE 3000

# Define active environment configs defaults
ENV PORT=3000
ENV NODE_ENV=production

# Start high-performance Express server
CMD ["npm", "start"]
