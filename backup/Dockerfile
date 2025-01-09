FROM ghcr.io/ironpeakservices/iron-alpine/iron-alpine:3.21.0

RUN apk add --update rclone gnupg coreutils && $APP_DIR/post-install.sh

COPY --chmod=500 --chown=app:app loop.sh /app/loop
COPY --chmod=500 --chown=app:app backup.sh /app/backup.sh

USER $APP_USER
CMD ["/app/loop"]
HEALTHCHECK --interval=30s CMD pgrep loop >/dev/null