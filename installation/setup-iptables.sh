#!/bin/sh

REDIS=172.22.0.3
INBOX=172.22.0.4
OUTBOX=172.22.0.5
RSPAMD=172.22.0.7
UNBOUND=172.22.0.8

##
# Global
##

# Allow established and related connections
iptables -I DOCKER-USER 1 -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT &&

##
# Inbox
##

# Allow DNS to Unbound (UDP and TCP)
iptables -I DOCKER-USER -s "$INBOX" -d "$UNBOUND" -p udp --dport 53 -j ACCEPT &&
iptables -I DOCKER-USER -s "$INBOX" -d "$UNBOUND" -p tcp --dport 53 -j ACCEPT &&

# Allow Redis (6379) to redis_mail
iptables -I DOCKER-USER -s "$INBOX" -d "$REDIS" -p tcp --dport 6379 -j ACCEPT &&

# Allow HTTP (11334) to rspamd
iptables -I DOCKER-USER -s "$INBOX" -d "$RSPAMD" -p tcp --dport 11334 -j ACCEPT &&

# Drop all other outbound traffic from Inbox
iptables -I DOCKER-USER -s "$INBOX" -j DROP &&

##
# Outbox
##

# Allow Redis (6379) to redis_mail
iptables -I DOCKER-USER -s "$OUTBOX" -d "$REDIS" -p tcp --dport 6379 -j ACCEPT &&

# Allow DNS to Unbound (UDP and TCP)
iptables -I DOCKER-USER -s "$OUTBOX" -d "$UNBOUND" -p udp --dport 53 -j ACCEPT &&
iptables -I DOCKER-USER -s "$OUTBOX" -d "$UNBOUND" -p tcp --dport 53 -j ACCEPT &&

# Drop all other outbound traffic from Outbox
iptables -I DOCKER-USER -s "$OUTBOX" -j DROP &&

echo "iptables rules installed"
