#!/usr/bin/env bash

while IFS= read -r line; do
    if echo "$line" | grep -q '^-A'; then
        iptables "$line"
    fi
done < "$(curl -fsL "https://raw.githubusercontent.com/Carlgo11/mailroom/master/conf/iptables/rules.v4")"

echo "iptables rules installed"
