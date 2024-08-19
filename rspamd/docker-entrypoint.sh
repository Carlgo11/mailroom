#!/bin/bash

password_hash=$(/usr/bin/rspamadm pw -e -p "$RSPAMD_PASSWORD")

cat <<EOF | tee /etc/rspamd/local.d/worker-controller.inc
bind_socket = "0.0.0.0:11334"
milter = no;
enable_password = "$password_hash";
password = "$password_hash";
EOF

exec "$@"