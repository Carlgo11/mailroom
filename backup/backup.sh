#!/bin/sh
DATE=$(date +%FT%TZ -u)
VHOST_DIR="${VHOST_DIR:-/var/mail/vhosts/}"
BACKUP_TMP="${BACKUP_TMP:-/tmp/backups}"
STAGING_DIR="${BACKUP_TMP}/${DATE}"
BACKUP_FILE="${DATE}.tar.gz"
PUBLIC_KEY="${PUBLIC_KEY:-$CONF_DIR/public.key}"

# Set up staging directory
mkdir -p "${BACKUP_TMP}"
chmod 700 "${BACKUP_TMP}"

echo "Collecting data..."
mkdir -p "${STAGING_DIR}/vhosts" || { echo "Error: Could not set up staging directory"; exit 1; }

# Copy mail directories
cp -r "$VHOST_DIR" "${STAGING_DIR}/vhosts" || { echo "Error: Failed to collect emails"; exit 1; }

# Copy config variables
printenv | grep -v "PWD\|TERM\|HOME\|SHLVL\|HOSTNAME" >> "${STAGING_DIR}/mailroom.env"

echo "Creating ${BACKUP_FILE}..."
tar -czf "${BACKUP_TMP}/${BACKUP_FILE}" -C "${STAGING_DIR}/" . || { echo "Error: Failed to create ${BACKUP_FILE}"; exit 1; }

# Delete staging directory
rm -rf "${STAGING_DIR:?}" || { echo "Error: Failed to remove staging directory"; exit 1; }

if [ -f "$PUBLIC_KEY" ]; then
    echo "Encrypting ${BACKUP_FILE}..."
    if gpg -e -f "$PUBLIC_KEY" "${BACKUP_TMP}/${BACKUP_FILE}"; then
      rm "${BACKUP_TMP}/${BACKUP_FILE}" || exit 1
    else
      echo "Error: Encryption failed. Falling back to unencrypted version."
    fi
fi

echo "Uploading backup to $RCLONE_REMOTE"
rclone copyto "${BACKUP_TMP}/${BACKUP_FILE}" "$RCLONE_REMOTE" --config "/tmp/rclone.conf" || { echo "Error: Upload failed"; exit 1; }

echo "Removing local backup file"
rm -rf "${BACKUP_TMP:?}"

echo "Backup completed."
