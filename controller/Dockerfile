FROM node:alpine
WORKDIR /usr/src/controller

COPY . .
RUN npm install --production & apk add openssl & wait

CMD ["src/server.js"]
