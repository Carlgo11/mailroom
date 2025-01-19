FROM node:20 AS build
COPY . /app
WORKDIR /app
RUN npm i --omit=dev && npm run test && rm -r test entrypoint.sh

FROM alpine

ENV LOG_FILE="/var/log/inbox.log"
ENV LOG_LEVEL="INFO"
ENV INBOX_COINTAINER_TLS_KEY="/etc/ssl/inbox/privkey.pem"
ENV INBOX_COINTAINER_TLS_CERT="/etc/ssl/inbox/cert.pem"
ENV MAILBOX_PATH="/var/mail/vhosts/"
ENV CLIENT_CERT_PATH="/etc/ssl/clients/"
ENV REDIS_HOST="redis_mail"
ENV REDIS_PORT=6379
ENV INBOX_MAX_CONNECTIONS=1024
ENV INBOX_PID="/tmp/inbox.pid"
ENV INBOX_PORT=25

RUN apk add --no-cache --virtual openssl nodejs; adduser -D -H -h /usr/src/inbox -u 1000 app

WORKDIR /usr/src/inbox

COPY --from=build --chown=1000 /app /usr/src/inbox
COPY --chmod=500 --chown=1000 entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER 1000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["src/index.js"]
HEALTHCHECK --interval=10s CMD /bin/busybox test -d "/proc/$(cat $INBOX_PID)"
EXPOSE $INBOX_PORT
