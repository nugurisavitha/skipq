# Build Stage
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build args for Vite env vars (set at build time)
ARG VITE_API_URL
ARG VITE_SOCKET_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build the React app
RUN npm run build

# Production Stage
FROM nginx:alpine AS prod

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Use sed to replace BACKEND_URL_PLACEHOLDER with the actual BACKEND_URL env var at runtime, then start nginx
CMD ["/bin/sh", "-c", "sed \"s|BACKEND_URL_PLACEHOLDER|$BACKEND_URL|g\" /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
