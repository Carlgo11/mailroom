#!/bin/sh

node "$*" 2>&1 | tee "$LOG_FILE"