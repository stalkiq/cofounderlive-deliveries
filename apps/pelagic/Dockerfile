FROM node:18-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy dependency definitions and install
COPY package*.json ./
RUN npm install --production

# Copy remaining source code (including standard fallbacks)
COPY . .

# Expose port (default 3000 in server.js)
EXPOSE 3000

# Set environment production flag
ENV NODE_ENV=production

# Start command
CMD [ "npm", "start" ]
