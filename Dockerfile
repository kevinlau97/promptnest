# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json .
COPY apps/web/package*.json apps/web/
COPY apps/server/package*.json apps/server/
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/promptnest.db
RUN mkdir -p /data
COPY --from=builder /app/apps/server/dist ./server
COPY --from=builder /app/apps/server/src/db/schema.sql ./server/db/schema.sql
COPY --from=builder /app/apps/web/dist ./web/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/node_modules ./server/node_modules
COPY --from=builder /app/apps/server/package.json ./server/package.json
COPY --from=builder /app/apps/server/fix-imports.mjs ./server/fix-imports.mjs
COPY package.json .
EXPOSE 3000
VOLUME ["/data"]
CMD ["node", "server/index.js"]
