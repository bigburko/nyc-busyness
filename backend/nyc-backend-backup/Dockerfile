# Use official Node.js image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose port 3000 (or the one your app uses)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
