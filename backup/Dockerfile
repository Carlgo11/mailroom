FROM alpine:latest
RUN apk add --no-cache rclone
COPY backup.sh /etc/periodic/daily/backup.sh
RUN chmod +x /etc/periodic/daily/backup.sh

ENTRYPOINT ["tail", "-F", "/dev/stdout"]