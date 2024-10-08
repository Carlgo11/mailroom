import * as crypto from 'node:crypto';
import Module from 'node:module';

export default class Email {
  constructor({
                id = this.generateID(),
                from = '',
                to = [],
                date = new Date().toISOString(),
                headers = {},
                subject = '',
                body = '',
                ehlo = '',
              } = {}) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.ehlo = ehlo;
    this.headers = headers;
    this.date = date;
    this.subject = subject;
    this.body = body;
  }

  /**
   * Parse message stream and populate object values
   *
   * @param {String} message - Raw message
   * @returns {Promise<Awaited<boolean>[]>} - Resolves if successful, otherwise rejects.
   * @throws Error - Throws error(s) if message parsing failed.
   */
  async parseMessage(message) {
    const headerBoundary = message.indexOf('\r\n\r\n');

    // Wait for header and body parsing to complete
    return Promise.all([
      this.parseHeaders(message.slice(0, headerBoundary)),
      this.parseBody(message.slice(headerBoundary + 4)),
    ]);
  }

  /**
   * Parse body from raw message
   *
   * @param {String} body Message part which is the email "body".
   * @returns {Promise<true>} - Returns true if parsing succeeded.
   * @throws Error - Throws error if parsing failed.
   */
  async parseBody(body){
    // Initialize body and mark headers as parsed
    this.body = body;

    // End of message received
    const require = Module.createRequire(import.meta.url);
    const {simpleParser} = require('mailparser');

    try {
      // Parse the full body for subject and other data
      const parsedEmail = await simpleParser(body);
      this.subject = parsedEmail.subject || this.headers.subject;
      return true;
    } catch (err) {
      throw new Error(`Error parsing email data: ${err.message}`);
    }
  }

  /**
   * Parse headers from raw message
   *
   * @param {String} headers - Message part that contains the email "headers".
   * @returns {Promise<true>} - Returns true if parsing succeeded.
   * @throws Error - Throws error is parsing failed.
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
    return true;
  }

  parseSession(session) {
    this.ip = session.clientIP;
    this.from = session.mailFrom;
    this.to = session.rcptTo;
    this.clientHostname = session.rDNS;
    this.remoteAddress = session.clientIP;
    this.ehlo = session.ehlo;
    return true;
  }

  addHeader(name, value) {
    const key = name.toLowerCase();
    if (this.headers[key]) {
      if (Array.isArray(this.headers[key])) {
        this.headers[key].push(value);
      } else {
        this.headers[key] = [this.headers[key], value];
      }
    } else {
      return this.headers[key] = value;
    }
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

  full_email = () => {
    return `${this.serializeHeaders()}\r\n\r\n${this.body}`;
  };
}
