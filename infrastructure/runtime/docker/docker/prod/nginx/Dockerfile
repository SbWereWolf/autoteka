# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
ARG VITE_API_BASE_URL=/api/v1
ARG FRONTEND_BUILD_SOURCEMAP=false
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_BUILD_SOURCEMAP=${FRONTEND_BUILD_SOURCEMAP}
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY frontend ./
RUN npm run build

FROM nginx:1.27-alpine AS runtime
RUN apk add --no-cache bash gettext  && rm -rf /usr/share/nginx/html/*
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY --from=infra runtime/docker/docker/prod/nginx/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=infra runtime/docker/docker/prod/nginx/entrypoint.sh /docker-entrypoint.d/40-render-config.sh
RUN mkdir -p /usr/share/nginx/backend-public/vendor/moonshine  && chmod +x /docker-entrypoint.d/40-render-config.sh
EXPOSE 80
