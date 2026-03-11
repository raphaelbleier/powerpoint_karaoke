# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

# Stage 2: Build Backend and Runner
FROM node:18-alpine
WORKDIR /app/backend

# Add tini for better signal handling
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

COPY backend/package*.json ./
RUN npm install --production

COPY backend .
# Copy frontend build to backend so it can be served
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 8080

CMD ["node", "index.js"]
