FROM alpine:latest
RUN apk add --no-cache rclone
COPY backup.sh /etc/periodic/daily/backup
RUN chmod +x /etc/periodic/daily/backup

ENTRYPOINT ["crond", "-f", "-d", "8"]