#!/bin/sh

RCLONE_CONFIG="${RCLONE_CONFIG:-/rclone.conf}"
TARGET_TIME="${TARGET_TIME:-00:00}"

if ! cp "$RCLONE_CONFIG" /tmp/rclone.conf 2>/dev/null; then
  echo "Error: Missing rclone config"
  exit 1
fi

if [ -n "${RCLONE_REMOTE}" ]; then
  echo "Error: Missing rclone remote"
  exit 1
fi

if [ -f /public.key ]; then
  echo "Public key found. Backups will be encrypted."
  export GNUPGHOME="/tmp/.gnupg"
else
  echo "No public key supplied. Backups will NOT be encrypted."
fi

while true; do
    current_time=$(date +%s)
    target_time=$(date -d "tomorrow ${TARGET_TIME}" +%s)
    diff_time=$(( target_time - current_time ))
    echo "Sleeping until $(date -R -d "tomorrow ${TARGET_TIME}")"
    sleep "${diff_time}"

    echo "$(date): Running backup script."
    sh -c /backup.sh
done
