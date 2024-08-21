FROM node:alpine
WORKDIR /usr/src/outbox

COPY package.json ./

RUN npm install --production

COPY . .

CMD ["node", "src/index.js"]