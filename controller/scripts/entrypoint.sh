#!/usr/bin/env sh

sh ./scripts/generate-ca.sh &

# Continue with the original entrypoint or command
exec "$@"
