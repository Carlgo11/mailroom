FROM node:alpine
WORKDIR /usr/src/inbox

COPY package.json ./

RUN npm install --production; apk add openssl

COPY . .

CMD ["node", "src/index.js"]