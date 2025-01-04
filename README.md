<h1 align="center">Mail Room</h1>

Mail Room is a lightweight email handling system built with Node.js and Docker, designed to securely process incoming and outgoing emails. It includes strict authentication checks (SPF, DKIM, ARC), spam detection using Rspamd, and integrates with Dovecot for mailbox management. The project is modular, consisting of distinct services that manage different aspects of email processing.

Table of contents
=================

- [Services](#services)
- [Installation](#installation)
- [Usage](#usage)
   * [Managing users and certificates](#managing-users-and-certificates)
- [Networking](#networking)
   * [Ports and Firewalls](#ports-and-firewalls)
   * [Internal Network](#internal-network)
- [License](#license)

## Services

Mail Room is designed as a modular email handling system, with distinct services managing specific aspects of email processing. These services are categorized into **native services** developed as part of Mail Room and **external services** integrated to handle specialized tasks.

### Native Services

| Name           | Description                                                                             | Status             |
|----------------|-----------------------------------------------------------------------------------------|--------------------|
| **Controller** | Provides APIs for managing user accounts, certificates, and other administrative tasks. | Experimental       |
| **Inbox**      | Processes incoming email traffic.                                                       | Production Release |
| **Outbox**     | Handles authenticated email submission and outgoing email traffic.                      | Under Development  |
| **Backup**     | Facilitates backup of user data, and certificates.                                      | Experimental       |

### External Services

| Name        | Description                                                                              | Website                            | License      |
|-------------|------------------------------------------------------------------------------------------|------------------------------------|--------------|
| **Dovecot** | IMAP server                                                                              | [dovecot.org](https://dovecot.org) | MIT & LGPLv2 |
| **Rspamd**  | Provides robust spam detection and scoring.                                              | [rspamd.com](https://rspamd.com/)  | Apache-2.0   |
| **Redis**   | Acts as a lightweight, high-performance database for configuration and state management. | [redis.io](https://redis.io/)      | RSALv2       |

## Installation

Before starting, ensure you have the following prerequisites installed:
- **cURL**: For downloading installation files.
- **Docker**: For container orchestration.
- **Docker Compose**: For container orchestration.
- **Node.js (>=20.x)**: Required for Mail Room CLI.
- **Git**: For cloning the repository (optional).

1. Download and run the installation script:
   ```shell
   curl https://raw.githubusercontent.com/Carlgo11/mailroom/master/installation/install.sh | bash
   ```

2. Edit the `mailroom.env` file.

3. Start the services, see [Usage](#Usage).

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