FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=96 --max-semi-space-size=16"
ENV UV_THREADPOOL_SIZE=4

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/package-lock.json* ./

RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force && \
    find ./node_modules -name "*.md" -delete 2>/dev/null || true && \
    find ./node_modules -name "*.ts" ! -name "*.d.ts" -delete 2>/dev/null || true

EXPOSE 8080

USER node

CMD ["node", "dist/index.js"]
