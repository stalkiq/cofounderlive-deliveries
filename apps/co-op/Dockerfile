# Use a lightweight official Node.js Alpine base image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package package.json to manage dependencies layer caching
COPY package.json ./

# Install production dependencies
RUN npm install --only=production

# Copy remaining source code files (including server.js, memory.json, and the public/ assets folder)
COPY . .

# Set dynamic execution port (falling back to Port 3000)
ENV PORT=3000
EXPOSE 3000

# Run the express web application server
CMD ["npm", "start"]
