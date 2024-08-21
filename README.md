# **Mail Room**

Mail Room is a lightweight email handling system built with Node.js and Docker, designed to securely process incoming and outgoing emails. It includes strict authentication checks (SPF, DKIM, ARC), spam detection using Rspamd, and integrates with Dovecot for mailbox management. The project is modular, consisting of distinct services that manage different aspects of email processing.

## Services

* __Inbox__ - SMTP server for incoming emails
* __Outbox__ - SMTP server for outgoing emails
* __Dovecot__ - IMAP server
* __Rspamd__ - Spam service
* __Redis__ - Database

## Requirements

To run the project you need a server with Docker and the following ports open:
- 25 - SMTP (inbox)
- 465 - SMTP (outbox)
- 993 - IMAP (dovecot)

## Installation

1. Clone the Repository
    ```bash
     git clone https://github.com/carlgo11/smtp-server.git
     cd smtp-server
    ```
2. Setup Environment Variables
   Create a .env file in the root of your project and configure the following environment variables:
   ```dotenv
    # Outbox (Submission) Server Configuration
    OUTBOX_PORT=465
    OUTBOX_HOST=smtp.example.com
    
    # Inbox (MX) Server Configuration
    INBOX_PORT=25
    INBOX_HOST=mail.example.com
    
    # Inbox TLS Configuration
    INBOX_TLS_KEY_PATH=/certs/inbox/privkey.pem
    INBOX_TLS_CERT_PATH=/certs/inbox/cert.pem
    
    # Outbox TLS configuration
    OUTBOX_TLS_KEY_PATH=/certs/outbox/privkey.pem
    OUTBOX_TLS_CERT_PATH=/certs/outbox/cert.pem
    OUTBOX_TLS_CA_PATH=/certs/outbox/ca-cert.pem
    
    # Global TLS configuration
    TLS_CIPHERS=TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256
    TLS_MIN_VERSION=TLSv1.3
    TLS_MAX_VERSION=TLSv1.3
    
    # Mailbox Configuration
    MAILBOX_PATH=/var/mail/vhosts/
    
    # Rspamd Configuration
    RSPAMD_PASSWORD=password
   ```
   
#### **Explanation of Environment Variables**

- **`OUTBOX_PORT`**:
    - Port for the Outbox (Submission) server, typically 465 for SMTPS.

- **`OUTBOX_HOST`**:
    - Hostname for the Outbox (Submission) server, such as `smtp.example.com`.

- **`INBOX_PORT`**:
    - Port for the Inbox (MX) server, typically 25 for standard SMTP.

- **`INBOX_HOST`**:
    - Hostname for the Inbox server, such as `mail.example.com`.

- **`INBOX_TLS_KEY_PATH`**:
    - Path to the private key for the Inbox server's TLS configuration.

- **`INBOX_TLS_CERT_PATH`**:
    - Path to the certificate for the Inbox server's TLS configuration.

- **`OUTBOX_TLS_KEY_PATH`**:
    - Path to the private key for the Outbox server's TLS configuration.

- **`OUTBOX_TLS_CERT_PATH`**:
    - Path to the certificate for the Outbox server's TLS configuration.

- **`OUTBOX_TLS_CA_PATH`**:
    - Path to the CA certificate for the Outbox server's TLS configuration.

- **`TLS_CIPHERS`**:
    - Specifies the cipher suites to be used. The provided list is focused on TLS 1.3 ciphers.

- **`TLS_MIN_VERSION`**:
    - The minimum supported TLS version (TLS 1.3 in this case).

- **`TLS_MAX_VERSION`**:
    - The maximum supported TLS version (also TLS 1.3 here).

- **`MAILBOX_PATH`**:
    - The base path for mailboxes on the server, where user mail is stored.

- **`RSPAMD_PASSWORD`**:
    - Password for connecting to the Rspamd service for spam filtering.

## Usage

### Running the project
Start the services using Docker Compose:
  ```bash
  docker compose up -d
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
  ├── inbox/                 # Inbox (MX) server source
  ├── outbox/                # Outbox (Submission) server source
  └── rspamd/                # Rspamd service Docker build instructions
  ```

## License

This project is licensed under GPLv3 - see the [LICENSE](/LICENSE) file for details.