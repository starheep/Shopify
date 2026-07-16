# Use Node image for building
FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose Vite port (default is 5173)
EXPOSE 5173

# Start Vite in host mode so it's accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]