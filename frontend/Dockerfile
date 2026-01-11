# Stage 1: Build the React application
FROM node:20-slim AS build

WORKDIR /app

# Copy package files
COPY package.json ./
# Check if bun.lock exists (based on list_dir output it does)
COPY bun.lock ./

# Install dependencies (using npm since bun might not be in the base image, but node is)
RUN npm install

# Copy the rest of the application code
COPY . .

# Pass build arguments to environment variables for Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built application from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
