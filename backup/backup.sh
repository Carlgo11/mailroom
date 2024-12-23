#!/bin/sh

exec > /dev/stdout 2>&1

VHOST_DIR="${VHOST_DIR:-/var/mail/vhosts/}"
BACKUP_TMP="${BACKUP_TMP:-/tmp/backups}"
RCLONE_REMOTE="${RCLONE_REMOTE:-backups:/backups}"
RCLONE_CONFIG="${RCLONE_CONFIG:-/rclone.conf}"

DATE=$(date +%FT%TZ -u)
BACKUP_FILE="${DATE}.tar.gz"

mkdir -p "$BACKUP_TMP"
cp "$RCLONE_CONFIG" /tmp/rclone.conf

echo "Creating $BACKUP_FILE"
tar -czf "${BACKUP_TMP}/${BACKUP_FILE}" -C "$VHOST_DIR" .

echo "Uploading backup to $RCLONE_REMOTE"
rclone copy "${BACKUP_TMP}" "$RCLONE_REMOTE" --config "/tmp/rclone.conf" || exit 1

echo "Removing local backup file"
rm -rf "${BACKUP_TMP:?}"

echo "Backup completed."
