<center>
<h1>Mail Room</h1>
</center>

Mail Room is a lightweight email handling system built with Node.js and Docker, designed to securely process incoming and outgoing emails. It includes strict authentication checks (SPF, DKIM, ARC), spam detection using Rspamd, and integrates with Dovecot for mailbox management. The project is modular, consisting of distinct services that manage different aspects of email processing.

Table of contents
=================

- [Services](#services)
   * [Development Progress](#development-progress)
- [Installation](#installation)
   * [Assisted Configuration](#assisted-configuration)
   * [Manual Configuration](#manual-configuration)
- [Usage](#usage)
   * [Managing users and certificates](#managing-users-and-certificates)
- [Networking](#networking)
   * [Ports and Firewalls](#ports-and-firewalls)
   * [Internal Network](#internal-network)
- [License](#license)

## Services

The goal with Mail Room is to handle SMTP traffic. As SMTP is only part of what is needed for modern email handling, other projects responsible for other protocols have been bundled with this project.

The following services are native to Mail Room:

| Name       | Description                           |       Status       |
|------------|---------------------------------------|:------------------:|
| Controller | Account management API server         |    Experimental    |
| Inbox      | SMTP server (MTA) for incoming emails | Production Release |
| Outbox     | SMTP server (MSA) for outgoing emails | Under Development  |
| Backup     | Backup service                        |    Experimental    |

These services are external projects bundled with Mail Room:

| Name    | Description      | Website                            | License      |
|---------|------------------|------------------------------------|--------------|
| Dovecot | IMAP server      | [dovecot.org](https://dovecot.org) | MIT & LGPLv2 |
| Rspamd  | Anti-spam server | [rspamd.com](https://rspamd.com/)  | Apache-2.0   |
| Redis   | Database server  | [redis.io](https://redis.io/)      | RSALv2       |

### Development Progress

The following features are currently not implemented:

#### Inbox
- [ ] DSN messages

#### Outbox
- [ ] CC/BCC
- [ ] DSN messages
- [ ] Greylisting
- [ ] Alias support
- [ ] Status emails on message failure

#### Controller
- [ ] DKIM certificate generation
- [ ] TLSA record generation
- [ ] Alias creation

## Installation

### Assisted Configuration
1. Run the installation script
   ```shell
   curl https://raw.githubusercontent.com/Carlgo11/mailroom/master/install.sh | bash
   ```
2. Edit the `.env` file
3. Start the containers
   ```shell
   docker compose up -d
   ```

### Manual Configuration

1. Create a directory
    ```bash
   mkdir mailroom
   cd mailroom
    ```
2. Download the `docker-compose.yml` file
   ```shell
   curl https://raw.githubusercontent.com/Carlgo11/mailroom/master/docker-compose.yml -O docker-compose.yml
   ```
3. Download the example configuration
   ```shell
   curl https://raw.githubusercontent.com/Carlgo11/mailroom/master/.env.example -O .env
   ```
4. Edit the `.env` file
5. Set up the certificate directories
   ```shell
   mkdir certs/{clients,dkim,dovecot,inbox,outbox} -p
   ```
6. Start the Docker containers
   ```shell
   docker compose up -d
   ```
7. Download the CLI tool
   ```shell
   npm install -g mailroom-cli
   ```

## Usage

To start the services using Docker Compose, run:
  ```bash
  docker compose up -d
  ```

### Managing users and certificates
To add or remove a user, use the mailroom cli tool:
   ```text
   Usage: ./mailroom-cli [command] [options]
   
   Commands:
     create-user <email> <password>   Create a new email user
     delete-user <email>              Delete an existing email user
     list-users                       List all email users
     get-user <email>                 Get details of a specific user
     generate-cert <email>            Generate a client certificate for the user
   ```

## Networking

### Ports and Firewalls

#### Incoming
| Port | Type | Destination       | Description       |
|------|------|-------------------|-------------------|
| 25   | TCP  | Inbox             | SMTP (incoming)   |
| 587  | TCP  | Outbox            | SMTP (submission) |
| 993  | TCP  | Dovecot           | IMAP              |

#### Outgoing
| Port | Type    | Source  | Description            |
|------|---------|---------|------------------------|
| 25   | TCP     | Outbox  | SMTP (outgoing)        |
| 53   | UDP/TCP | Unbound | DNS                    |
| 443  | TCP     | Inbox   | IP reputation services |
| 443  | TCP     | Rspamd  | IP reputation services |

### Internal Network

The project uses a dedicated network for inter-container communication. Said network is named "Postnet".
The default subnet mask for Postnet is `255.255.255.240` which corresponds to `172.22.0.0/28`.

This is the address table for the Postnet:

| IPv4 Address | Hostname   |
|--------------|------------|
| 172.22.0.1   | HOST       |
| 172.22.0.2   |            |
| 172.22.0.3   | redis_mail |
| 172.22.0.4   | inbox      |
| 172.22.0.5   | outbox     |
| 172.22.0.6   | dovecot    |
| 172.22.0.7   | rspamd     |
| 172.22.0.8   | unbound    |

## License

This project is licensed under GPLv3 - see the [LICENSE](/LICENSE) file for details.