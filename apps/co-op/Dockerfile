# Use lightweight, LTS Node.js alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency mappings first for optimal layer caching
COPY package.json ./

# Install clean production dependencies
RUN npm install --omit=dev

# Copy all application assets to the filesystem
COPY . .

# Set environment defaults
ENV PORT=3000
ENV NODE_ENV=production

# Expose server listener port
EXPOSE 3000

# Start deployment server
CMD ["npm", "start"]
