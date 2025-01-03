FROM alpine:latest

RUN apk upgrade -U; apk add --no-cache rclone gnupg coreutils; adduser backup -D -H

COPY --chmod=500 --chown=backup:backup loop.sh /loop
COPY --chmod=500 --chown=backup:backup backup.sh /backup.sh

USER backup
ENTRYPOINT ["/loop"]
HEALTHCHECK --interval=30s CMD pgrep loop >/dev/null