FROM node:alpine
WORKDIR /usr/src/controller

COPY package.json ./
RUN npm install --production

COPY . .

CMD ["node", "src/server.js"]
