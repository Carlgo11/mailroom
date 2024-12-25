set -e

echo "Creating new Docker Compose file..."
# Define repository URL for installation files
COMPONENTS="https://raw.githubusercontent.com/Carlgo11/mailroom/master/installation/compose"
FILE="docker-compose.yml"

install() {
  if ! curl -fsL "${COMPONENTS}/${1}" >> $FILE; then
    echo "Failed to download component $1"
    exit 1
  fi
}

install '_head'
install 'redis'
install 'controller'

read -rp "Include service Inbox? (y/n): " inbox
if [[ "$inbox" =~ ^[Yy]$ ]]; then
  install 'inbox'
fi

read -rp "Include service Outbox? (y/n): " outbox
if [[ "$outbox" =~ ^[Yy]$ ]]; then
  install 'outbox'
fi

read -rp "Include service Dovecot? (y/n): " dovecot
if [[ "$dovecot" =~ ^[Yy]$ ]]; then
  install 'dovecot'
fi

read -rp "Include service Rspamd? (y/n): " rspamd
if [[ "$rspamd" =~ ^[Yy]$ ]]; then
  install 'rspamd'
fi

read -rp "Include service Backup? (y/n): " backup
if [[ "$backup" =~ ^[Yy]$ ]]; then
  install 'backup'
fi

install '_tail'

echo "Docker Compose file configured."