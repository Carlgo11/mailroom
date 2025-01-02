#!/bin/sh

while true; do
    # Check if it's midnight
    if [ "$(date +%H:%M)" = "00:00" ]; then
        echo "$(date): Running backup script."
        /backup.sh
    fi

    # Sleep for 60 seconds to avoid unnecessary checks
    sleep 60
done