# Multi-stage Docker build for frontend (Vue + Vite)

# 1) Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install deps (frontend only)
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy frontend sources
COPY frontend ./frontend

# Build
RUN cd frontend && npm run build

# 2) Runtime stage
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY deploy/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
