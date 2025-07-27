# Multi-stage build for better optimization

# Build stage
FROM node:18-alpine AS builder

# Set the working directory in container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the full project
COPY . .

# Build the Next.js project
RUN NEXT_DISABLE_ESLINT=true npm run build

# Production stage
FROM node:18-alpine AS runner

# Set the working directory in container
WORKDIR /app

# Add a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --production --silent

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Expose the port (default Next.js port)
EXPOSE 3000

# Set environment variable
ENV NODE_ENV=production

# Run the app
CMD ["npm", "start"]