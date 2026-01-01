# Multi-stage Dockerfile for Web Client
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json yarn.lock ./
COPY services/client-web/package.json ./services/client-web/
RUN yarn install --frozen-lockfile

FROM base AS development
COPY services/client-web ./services/client-web
CMD ["yarn", "workspace", "client-web", "dev"]

FROM base AS build
COPY services/client-web ./services/client-web
RUN yarn workspace client-web build

FROM nginx:stable-alpine AS production
COPY --from=build /app/services/client-web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
