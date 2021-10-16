FROM node:14 as build-deps
WORKDIR /app

ADD package.json package-lock.json /app/
RUN npm ci

ADD ./ /app
RUN REACT_APP_ENABLE_CACHING_BACKEND=true npm run build

FROM nginx:alpine

COPY default.conf /etc/nginx/conf.d/
COPY --from=build-deps /app/build/ /server_root/

ARG NGINX_MODE=prod
COPY robots.txt.$NGINX_MODE /server_root/robots.txt