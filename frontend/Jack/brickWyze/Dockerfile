# Use official Node.js LTS image
FROM node:18-alpine

# Set the working directory in container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the full project
COPY . .

# Build the Next.js project
RUN NEXT_DISABLE_ESLINT=true npm run build


# Expose the port (default Next.js port)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
