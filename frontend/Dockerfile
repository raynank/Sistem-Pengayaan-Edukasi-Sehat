# Stage 1: Builder — install dependencies dan build aplikasi
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files dan install dependencies
COPY package*.json ./
RUN npm ci

# Copy seluruh source code
COPY . .

# Build Next.js dengan output standalone (image produksi lebih kecil)
# NEXT_PUBLIC_API_URL harus diset saat build karena diekspor ke client-side bundle
ARG NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

RUN npm run build

# Stage 2: Runner — image produksi yang ringan
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Salin artefak build standalone dari stage builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
