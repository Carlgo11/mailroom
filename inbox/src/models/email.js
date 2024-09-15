const crypto = require('crypto');
const {simpleParser} = require('mailparser');

class Email {
  constructor({
                id = this.generateID(),
                from = '',
                to = [],
                raw = '',
                date = new Date().toISOString(),
              } = {}) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.headers = {};
    this.raw = raw;
    this.date = date;
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
            this.body = emailData.slice(
                headerEndIndex + emailData.match(/\r?\n\r?\n/)[0].length); // Skip the header boundary
          } else {
            // If no proper header end found, treat the entire email as body (this case should be rare)
            this.body = emailData;
          }

          // Parse headers into a structured object
          const parsedEmail = await simpleParser(emailData);

          const headers = emailData.split('\r\n\r\n')[0];
          headers.split('\r\n').map(header => {
            const key = header.split(':')[0];
            const value = header.replace(`${key}: `, '');
            if (Object.keys(this.headers).includes(key)) {
              this.headers[key] = [this.headers[key], value];
            } else {
              this.headers[key] = value;
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

  parseSession(session) {
    this.ip = session.remoteAddress;
    this.from = session.envelope.mailFrom.address;
    this.to = session.envelope.rcptTo.map(r => r.address);
    this.hostNameAppearsAs = session.hostNameAppearsAs;
    this.clientHostname = session.clientHostname
    return true;
  }

  addHeader(name, value) {
    return this.headers[name] = value;
  }

  async removeHeader(name) {
    return Object.keys(this.headers).map(async (header) => {
      if(header.toLowerCase() === name.toLowerCase())
        delete this.headers.header
    })
  }

  generateID() {
    const timestamp = Date.now();
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `${timestamp}.${randomPart}.${process.env.INBOX_HOST}`;
  }

  serializeHeaders(headers = this.headers) {
    return Object.entries(headers).map(([key, value]) => {
      // Check if value is an object with value and params
      if (value && typeof value === 'object') {
        return value.map(v => {
          return `${key}: ${v}`;
        }).join('\r\n');
      }
      // Otherwise, treat it as a simple string
      return `${key}: ${value}`;
    }).join('\r\n');
  }
}

module.exports = Email;
