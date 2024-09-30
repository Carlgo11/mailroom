#!/usr/bin/env bash
set -e

if [ ! "$(which curl)" ]; then
  echo "Installation requires cURL"
  exit 1
fi

# Create root directory

mkdir mailroom
cd mailroom

# Download essential files
curl https://raw.githubusercontent.com/Carlgo11/mailroom/master/.env.example -O .env
curl https://raw.githubusercontent.com/Carlgo11/mailroom/master/docker-compose.yml -O docker-compose.yml

# Create certificates directory
mkdir certs/{clients,dkim,dovecot,inbox,outbox} -p

# Set up configuration file
mv .env.example .env

# Install CLI tool
npm i -g mailroom-cli