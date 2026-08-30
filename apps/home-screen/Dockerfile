# Use lightweight LTS Node image
FROM node:20-alpine

# Set environment
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy dependency structures
COPY package*.json ./

# Install dependecies
RUN npm ci --only=production

# Bundle source code
COPY . .

# Ensure data directory has secure permissions (for durable container memory mounts)
RUN mkdir -p data && chmod -R 777 data

# Expose server port
EXPOSE 3000

# Start server node
CMD [ "npm", "start" ]
