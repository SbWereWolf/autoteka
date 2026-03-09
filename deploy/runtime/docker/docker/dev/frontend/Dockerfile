# syntax=docker/dockerfile:1.7
FROM node:20-alpine
WORKDIR /workspace/frontend
COPY deploy/runtime/docker/docker/dev/frontend/entrypoint.sh /usr/local/bin/dev-frontend-entrypoint
RUN chmod +x /usr/local/bin/dev-frontend-entrypoint
EXPOSE 5173
ENTRYPOINT ["/usr/local/bin/dev-frontend-entrypoint"]
CMD []
