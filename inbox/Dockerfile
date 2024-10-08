FROM node:20 AS build
COPY . /app
WORKDIR /app

RUN npm i --omit=dev

FROM gcr.io/distroless/nodejs20-debian12

ENV INBOX_PORT="25"
ENV INBOX_HOST="smtp.example.com"
ENV INBOX_LOG_FILE="/tmp/inbox.log"
ENV INBOX_TLS_MIN_VERSION="TLSv1.3"
ENV INBOX_TLS_KEY_PATH="/certs/inbox/privkey.pem"
ENV INBOX_TLS_CERT_PATH="/certs/inbox/cert.pem"
ENV REDIS_HOST="redis_mail"
ENV REDIS_PORT="6379"

WORKDIR /usr/src/inbox

COPY --from=build /app /usr/src/inbox

CMD ["src/index.js"]