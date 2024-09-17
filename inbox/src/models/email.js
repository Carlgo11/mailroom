import * as crypto from 'node:crypto';
import Module from 'node:module';

const require = Module.createRequire(import.meta.url);

export default class Email {
  constructor({
                id = this.generateID(),
                from = '',
                to = [],
                raw = '',
                date = new Date().toISOString(),
                subject = '',
              } = {}) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.headers = {};
    this.raw = raw;
    this.date = date;
    this.subject = subject;
  }

  async parseStream(stream) {
    const {simpleParser} = require('mailparser');

    let data = '';

    stream.on('data', (chunk) => data += chunk.toString());

    return new Promise(async (resolve, reject) => {
      stream.on('end', async () => {
        this.raw = data;

        try {
          const [headers, body] = data.split('\r\n\r\n');

          if (headers) {
            this.body = body;
            this.parseHeaders(headers);
            this.subject = (await simpleParser(body)).subject || '';
          } else {
            // If no proper header end found, treat the entire email as body
            this.body = data;
          }

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

  parseHeaders(headers) {
    headers.split('\r\n').map(async (header) => {
      const key = header.split(':')[0];
      const value = header.replace(`${key}: `, '');
      if (Object.keys(this.headers).includes(key))
        this.headers[key] = [this.headers[key], value];
      else
        this.headers[key] = value;
    });
  }

  parseSession(session) {
    this.ip = session.remoteAddress;
    this.from = session.envelope.mailFrom.address;
    this.to = session.envelope.rcptTo.map(r => r.address);
    this.hostNameAppearsAs = session.hostNameAppearsAs;
    this.clientHostname = session.clientHostname;
    return true;
  }

  addHeader(name, value) {
    return this.headers[name] = value;
  }

  async getHeader(name) {
    return Object.keys(this.headers).map(async (header) => {
      if (header.toLowerCase() === name.toLowerCase())
        return this.headers.header;
    });
  }

  async removeHeader(name) {
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
