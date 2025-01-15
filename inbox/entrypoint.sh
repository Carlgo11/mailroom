#!/bin/sh

npm run test &&
node "$*" 2>&1 | tee "$LOG_FILE"