#!/usr/bin/env sh

sh ./generate-ca.sh &

# Continue with the original entrypoint or command
exec "$@"
