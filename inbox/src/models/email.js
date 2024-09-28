import * as crypto from 'node:crypto';
import Module from 'node:module';

export default class Email {
  constructor({
                id = this.generateID(),
                from = '',
                to = [],
                date = new Date().toISOString(),
                subject = '',
              } = {}) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.headers = {};
    this.date = date;
    this.subject = subject;
    this.body = '';
  }

  /**
   * Parse message stream and populate object values
   *
   * @param stream Raw message data stream
   * @returns {Promise<void>} Resolves if successful, otherwise rejects.
   */
  parseStream(stream) {
    let data = '';
    let headersParsed = false;

    stream.setEncoding('utf8');

    return new Promise((resolve, reject) => {

      // Data chunk received
      stream.on('data', (chunk) => {
        // If headers haven't been parsed, accumulate data and check for boundary
        if (!headersParsed) {
          data += chunk;
          const headerBoundaryIndex = data.indexOf('\r\n\r\n');

          if (headerBoundaryIndex !== -1) {
            const headers = data.slice(0, headerBoundaryIndex);
            this.parseHeaders(headers).then(() => {

            });
            // Initialize body and mark headers as parsed
            this.body = data.slice(headerBoundaryIndex + 4); // Skip the boundary
            headersParsed = true;
          }
        } else {
          // Append remaining data directly to body
          this.body += chunk;
        }
      });

      // End of message received
      stream.once('end', async () => {
        const require = Module.createRequire(import.meta.url);
        const {simpleParser} = require('mailparser');

        if (this.body === '')
          reject(new Error('No message body'));

        try {
          // Parse the full body for subject and other data
          const parsedEmail = await simpleParser(this.body);
          this.subject = parsedEmail.subject || this.headers.subject;
          resolve();
        } catch (err) {
          reject(new Error(`Error parsing email data: ${err.message}`));
        }
      });

      // Handle stream errors
      stream.once('error', (err) =>
          reject(new Error(`Error processing incoming email: ${err.message}`)),
      );
    });
  }

  /**
   * Parse header string into object
   *
   * @param headers
   * @returns {Promise<void>}
   */
  async parseHeaders(headers) {
    // Unfold headers: replace any CRLF followed by whitespace with a single space
    const unfoldedHeaders = headers.replace(/\r\n[ \t]+/g, ' ').split('\r\n');

    // Split headers into individual lines
    await Promise.all(unfoldedHeaders.map((headerLine) => {

      // Skip empty lines (in case of extra CRLFs)
      if (!headerLine.trim()) return;

      // Find the first colon, which separates the header name and value
      const index = headerLine.indexOf(':');
      if (index === -1) {
        // Invalid header line (no colon found), skip or handle error
        console.warn(`Invalid header line: ${headerLine}`);
        return;
      }

      // Extract header name and value
      const key = headerLine.slice(0, index).trim().toLowerCase(); // Normalize to lowercase
      const value = headerLine.slice(index + 1).trim();

      // Initialize the header key in the headers object if it doesn't exist
      if (!this.headers[key]) {
        this.headers[key] = value;
      } else {
        // If the header key already exists, convert it to an array or append to the array
        if (Array.isArray(this.headers[key])) {
          this.headers[key].push(value);
        } else {
          this.headers[key] = [this.headers[key], value];
        }
      }
    }));
  }

  parseSession(session) {
    this.ip = session.remoteAddress;
    this.from = session.envelope.mailFrom.address;
    this.to = session.envelope.rcptTo.map(r => r.address);
    this.hostNameAppearsAs = session.hostNameAppearsAs;
    this.clientHostname = session.clientHostname;
    this.remoteAddress = session.remoteAddress;
    return true;
  }

  addHeader(name, value) {
    return this.headers[name.toLowerCase()] = value;
  }

  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }

  removeHeader(name) {
    return Object.keys(this.headers).map(async (header) => {
      if (header.toLowerCase() === name.toLowerCase())
        delete this.headers.header;
    });
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
