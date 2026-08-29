# Use the official lightweight Node.js 18 LTS image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy application files (excluding those in .dockerignore)
COPY . .

# Expose the application port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD [ "npm", "start" ]
