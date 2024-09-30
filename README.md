# **Mail Room**

Mail Room is a lightweight email handling system built with Node.js and Docker, designed to securely process incoming and outgoing emails. It includes strict authentication checks (SPF, DKIM, ARC), spam detection using Rspamd, and integrates with Dovecot for mailbox management. The project is modular, consisting of distinct services that manage different aspects of email processing.

## Services

* __Controller__ - Account management API
* __Inbox__ - SMTP server (MTA) for incoming emails
* __Outbox__ - SMTP server (MSA) for outgoing emails
* __Dovecot__ - IMAP server
* __Rspamd__ - Spam service
* __Redis__ - Account database

## Requirements

To run the project you need a server with Docker and the following ports open:
- 25 - SMTP (inbox)
- 465 - SMTP (outbox)
- 993 - IMAP (dovecot)

## Installation

### Assisted configuration

1. Run the installation script
   ```shell
   curl https://raw.githubusercontent.com/Carlgo11/mailroom/master/install.sh | bash
   ```
2. Edit the `.env` file
3. Start the containers
   ```shell
   docker compose up -d
   ```

### Manual configuration

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

### Running the project
Start the services using Docker Compose:
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

## Project Structure
  ```text
  .
  ├── certs/                 # SSL/TLS certificates for inbox, outbox, and dovecot
  │   ├── dovecot/
  │   ├── inbox/
  │   └── outbox/
  ├── conf/                  # Configuration files
  │   ├── dovecot/
  │   └── rspamd/
  ├── controller/            # Controller server source
  ├── inbox/                 # Inbox (MX) server source
  ├── outbox/                # Outbox (Submission) server source
  └── rspamd/                # Rspamd service Docker build instructions
  ```

## Current limitations
The following features are currently not implemented:
### Inbox
- Multi-mailbox RCPT
- DSN messages

## Outbox
- CC/BCC
- DSN messages
- Greylisting
- Alias support
- Status emails on message failure

## Controller
- DKIM certificate generation
- TLSA record generation
- Alias creation

## License

This project is licensed under GPLv3 - see the [LICENSE](/LICENSE) file for details.