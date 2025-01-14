FROM node:20 AS build
COPY . /app
WORKDIR /app
RUN rm entrypoint.sh
RUN npm i --omit=dev

FROM node:20-alpine

ENV LOG_FILE="/var/log/inbox.log"
ENV LOG_LEVEL="INFO"
ENV INBOX_COINTAINER_TLS_KEY="/etc/ssl/inbox/privkey.pem"
ENV INBOX_COINTAINER_TLS_CERT="/etc/ssl/inbox/cert.pem"
ENV REDIS_HOST="redis_mail"
ENV REDIS_PORT=6379
ENV INBOX_MAX_CONNECTIONS=1024
ENV INBOX_PORT=25

RUN apk add openssl

WORKDIR /usr/src/inbox

COPY --from=build /app /usr/src/inbox
COPY --chmod=500 --chown=1000 entrypoint.sh /entrypoint.sh
EXPOSE $INBOX_PORT

USER 1000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["src/index.js"]