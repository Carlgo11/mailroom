FROM alpine:latest
RUN apk upgrade -U; apk add --no-cache rclone
COPY backup.sh /etc/periodic/daily/backup
COPY --chmod=400 cron.txt /var/spool/cron/crontabs/root
RUN chmod +x /etc/periodic/daily/backup

ENTRYPOINT ["crond", "-f", "-d", "8"]
HEALTHCHECK --start-period=10s --interval=30s CMD pgrep crond >/dev/null