# Build environment stage
FROM node:18-alpine as builder

WORKDIR /usr/src/app

# Install package dependencies
COPY package*.json ./
RUN npm ci --only=production

# Final runner stage
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy dependencies and application codebase
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY public/ ./public/

# Expose port and startup
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
