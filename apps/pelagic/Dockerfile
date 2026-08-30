# Use a highly optimized and lightweight official Node Alpine image
FROM node:18-alpine

# Establish isolated control workspace inside container
WORKDIR /app

# Copy essential package manifestations first to benefit from Docker layers cache
COPY package.json ./

# Execute clean install of production dependencies (ignores devDependencies like nodemon)
RUN npm install --only=production

# Shift rest of project source files to container space
COPY . .

# Expose default operational port (3000)
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Define volume for durable memory persistence on production hosts
VOLUME ["/app/data"]

# Bootstrap the Pelagic sovereign server control deck
CMD ["npm", "start"]
