#!/bin/sh

RCLONE_CONFIG="${RCLONE_CONFIG:-$CONF_DIR/rclone.conf}"
TARGET_TIME="${TARGET_TIME:-00:00}"
PUBLIC_KEY="${PUBLIC_KEY:-$CONF_DIR/public.key}"

if ! cp "$RCLONE_CONFIG" /tmp/rclone.conf 2>/dev/null; then
  echo "Error: Missing rclone config in ${RCLONE_CONFIG}"
  exit 1
fi

if [ -z "$RCLONE_REMOTE" ]; then
  echo "Error: Missing rclone remote"
  exit 1
fi

if [ -f "$PUBLIC_KEY" ]; then
  echo "Public key found. Backups will be encrypted."
  export GNUPGHOME="/tmp/.gnupg"
else
  echo "No $PUBLIC_KEY supplied. Backups will NOT be encrypted."
fi

while true; do
    current_time=$(date +%s)
    target_time=$(date -d "tomorrow ${TARGET_TIME}" +%s)
    diff_time=$(( target_time - current_time ))
    echo "Sleeping until $(date -R -d "tomorrow ${TARGET_TIME}")"
    sleep "${diff_time}"

    echo "$(date): Running backup script."
    sh -c "$APP_DIR/backup.sh"
done
