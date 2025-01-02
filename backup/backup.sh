#!/bin/sh

exec > /dev/stdout 2>&1

VHOST_DIR="${VHOST_DIR:-/var/mail/vhosts/}"
BACKUP_TMP="${BACKUP_TMP:-/tmp/backups}"
RCLONE_REMOTE="${RCLONE_REMOTE:-backups:/backups}"
RCLONE_CONFIG="${RCLONE_CONFIG:-/rclone.conf}"
export GNUPGHOME="/tmp/.gnupg"

DATE=$(date +%FT%TZ -u)
BACKUP_FILE="${DATE}.tar.gz"

mkdir -p "$BACKUP_TMP"

if ! cp "$RCLONE_CONFIG" /tmp/rclone.conf; then
  echo "rclone config not set"
  exit 1
fi

echo "Creating $BACKUP_FILE"
tar -czf "${BACKUP_TMP}/${BACKUP_FILE}" -C "$VHOST_DIR" .

if [ -f /public.key ]; then

    echo "/public.key found. Encrypting the backup."

    if gpg -e -f /public.key "${BACKUP_TMP}/${BACKUP_FILE}"; then
      rm "${BACKUP_TMP}/${BACKUP_FILE}" || exit 1
    else
      echo "GPG encryption failed"
    fi
else
    echo "No public key found. Proceeding without encryption."
fi

echo "Uploading backup to $RCLONE_REMOTE"
rclone copy "${BACKUP_TMP}" "$RCLONE_REMOTE" --config "/tmp/rclone.conf" || exit 1

echo "Removing local backup file"
rm -rf "${BACKUP_TMP:?}"

echo "Backup completed."
