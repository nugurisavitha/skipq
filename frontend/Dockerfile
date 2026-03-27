# Development Stage
FROM node:18-alpine AS dev

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose port (Vite default dev server port)
EXPOSE 5173

# Development server
CMD ["npm", "run", "dev"]

# Build Stage
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the React app
RUN npm run build

# Production Stage
FROM nginx:alpine AS prod

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health.html || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
