# --- Stage 1: build the React client ---
FROM node:22-alpine AS client
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# --- Stage 2: server + built client ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
# Serve the built client from ./public
COPY --from=client /client/dist ./public
EXPOSE 3600
CMD ["node", "src/index.js"]
