FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm install

COPY apps/web apps/web
WORKDIR /app/apps/web
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf