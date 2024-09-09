FROM node:alpine
WORKDIR /usr/src/inbox

ENV INBOX_PORT="25"
ENV INBOX_HOST="smtp.example.com"
ENV INBOX_TLS_MIN_VERSION="1.2"
ENV INBOX_TLS_KEY_PATH="/certs/inbox/privkey.pem"
ENV INBOX_TLS_CERT_PATH="/certs/inbox/cert.pem"

COPY package.json ./

RUN npm install --production; apk add openssl

COPY . .

CMD ["node", "src/index.js"]