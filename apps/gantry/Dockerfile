# Use lightweight alpine base for high speed and minimal surface vulnerabilities
FROM node:18-alpine

# Set standard application directory
WORKDIR /usr/src/app

# Cache standard base packages separately to improve cache reuse
COPY package*.json ./

# Install production dependencies 
RUN npm ci --only=production

# Copy application assets and files
COPY . .

# Expose internal HTTP port
EXPOSE 3000

# Set environment
ENV PORT=3000
ENV NODE_ENV=production

# Run industrial Gantry execution engine on launch
CMD [ "npm", "start" ]
