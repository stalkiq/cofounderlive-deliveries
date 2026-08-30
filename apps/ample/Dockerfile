# Use the official lightweight Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy dependency configs
COPY package*.json ./

# Install production dependencies only for quick light builds
RUN npm install --omit=dev

# Copy all repository source files (server, codebases, view assets)
COPY . .

# Set correct storage write rights to node to sustain memory.json updates safely
RUN mkdir -p data && chown -R node:node data

# Switch command thread context to normal secure node user
USER node

# Expose standard production port
EXPOSE 3000

# Set environment keys
ENV PORT=3000
ENV NODE_ENV=production

# Startup launch command
CMD ["npm", "start"]
