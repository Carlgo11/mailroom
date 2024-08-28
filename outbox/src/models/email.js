const crypto = require('crypto');
const { simpleParser } = require('mailparser');

class Email {
  constructor({
                id = this.generateID(),
                from = '',
                to = [],
                raw = '',
                pgp = null,
              } = {}) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.headers = {}
    this.raw = raw;
    this.pgp = pgp;
  }

  async parseStream(stream) {
    return new Promise(async (resolve, reject) => {
      let emailData = '';

      stream.on('data', (chunk) => emailData += chunk.toString());

      stream.on('end', async () => {
        this.raw = emailData;

        try {
          // Find the end of headers (ensure to cover both \r\n\r\n and \n\n cases)
          const headerEndIndex = emailData.search(/\r?\n\r?\n/);

          if (headerEndIndex !== -1) {
            this.body = emailData.slice(headerEndIndex + emailData.match(/\r?\n\r?\n/)[0].length); // Skip the header boundary
          } else {
            // If no proper header end found, treat the entire email as body (this case should be rare)
            this.body = emailData;
          }

          // Parse headers into a structured object
          const parsedEmail = await simpleParser(emailData);

          this.headers = {};
          parsedEmail.headers.forEach((value, key) => {
            if (typeof value === 'object' && value.text) {
              this.headers[key] = value.text; // Use the 'text' representation for complex headers
            } else {
              this.headers[key] = value; // Directly assign simple headers
            }
          });

          // Optionally extract other properties if needed
          this.subject = parsedEmail.subject || '';

          resolve();
        } catch (err) {
          reject(new Error(`Error parsing email data: ${err.message}`));
        }
      });

      stream.on('error', (err) => reject(
          new Error(`Error processing incoming email: ${err.message}`),
      ));
    });
  }

  parseSession(session){
    this.ip = session.remoteAddress;
    this.from = session.envelope.mailFrom.address;
    this.to = session.envelope.rcptTo.map(r => r.address);
    this.hostname = session.clientHostname;
    return true;
  }

  addHeader(name, value){
    return this.headers[name] = value
  }

  generateID() {
    const timestamp = Date.now();
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `${timestamp}.${randomPart}.localhost`;
  }

  // Method to add a recipient
  addRecipient(recipient) {
    this.to.push(recipient);
  }

  // Method to serialize the email for storage or transmission
  serialize() {
    return {
      ...this.headers,
      ID: this.id,
      IP: this.ip,
      Hostname: this.hostname,
      Rcpt: this.to,
    };
  }
}

module.exports = Email;
