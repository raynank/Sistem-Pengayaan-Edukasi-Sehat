# Stage 1: Builder - install dependencies dan build aplikasi
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files dan install dependencies
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm config set fetch-timeout 900000 \
    && npm config set fetch-retries 8 \
    && npm config set fetch-retry-mintimeout 30000 \
    && npm config set fetch-retry-maxtimeout 180000 \
    && npm ci --no-audit --progress=false

# Copy seluruh source code
COPY . .

# NEXT_PUBLIC_API_URL harus diset saat build karena dipakai client-side bundle
ARG NEXT_PUBLIC_API_URL=http://192.168.56.11/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

RUN npm run build

# Stage 2: Runner - image produksi yang ringan
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0

# Salin artefak build standalone dari stage builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 80

CMD ["node", "server.js"]
