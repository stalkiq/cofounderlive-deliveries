# Use lightweight node:18-alpine as base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency configs first to optimize Docker layer cache
COPY package.json ./

# Install production dependencies
RUN npm install --only=production

# Copy remaining source code of the application
COPY server.js ./
COPY public/ ./public/

# Create a volume directory for durable JSON state memory storage
RUN mkdir -p data

# Expose server port 
EXPOSE 3000

# Set environment production flag
ENV NODE_ENV=production
ENV PORT=3000

# Executing start script
CMD ["npm", "start"]
