#!/bin/sh

SPOOL="/var/spool/smtpd"

chmod 711 "$SPOOL"

mkdir "$SPOOL/offline" -p
chmod 770 "$SPOOL/offline"
chown 0:102 "$SPOOL/offline"

mkdir "$SPOOL/purge"
chmod 700 "$SPOOL/purge"
chown 101:0 "$SPOOL/purge"

mkdir "$SPOOL/queue"
chmod 700 "$SPOOL/queue"
chown 101:0 "$SPOOL/queue"

smtpd -d -v -P mda &

node "$*"
