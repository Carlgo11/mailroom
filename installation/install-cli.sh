#!/usr/bin/env bash
set -e

echo "Installing Mail Room CLI tool..."
npm i -g mailroom-cli

if [[ $? -ne 0 ]]; then
  echo "Failed to install Mail Room CLI tool"
  exit 1
else
  echo "CLI tool installed successfully!"
fi
