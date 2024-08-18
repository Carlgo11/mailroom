const crypto = require('crypto');
const { simpleParser } = require('mailparser');

class Email {
  constructor({
                id = this.generateID(),
                from = '',
                to = [],
                data = '',
              } = {}) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.headers = {}
    this.data = data;
  }

  async parseStream(stream) {
    return new Promise(async (resolve, reject) => {
      let emailData = '';

      stream.on('data', (chunk) => emailData += chunk.toString());

      stream.on('end', async () => {
        console.log(emailData);
        this.data = emailData;
        const parsedEmail = await simpleParser(emailData);

        this.headers = parsedEmail.headers;
        this.subject = parsedEmail.subject;
        resolve();
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
      ID: this.id,
      IP: this.ip,
      Hostname: this.hostname,
      From: this.from,
      Rcpt: this.to,
      Subject: this.subject,
    };
  }
}

module.exports = Email;
