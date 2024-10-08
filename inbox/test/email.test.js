import {describe, it} from 'node:test';
import {Readable} from 'node:stream';
import assert from 'node:assert';
import Email from '../src/models/email.js';

// Helper function to create a stream from a string
function createStreamFromString(str) {
  return new Readable({
    read() {
      this.push(str);
      this.push(null); // End the stream
    },
  });
}

describe('Email.parseHeaders', () => {
  it('should correctly parse standard headers', () => {
    const email = new Email();
    const headers = `Subject: Test Email\r\nFrom: sender@example.com\r\nTo: recipient@example.com\r\n`;

    email.parseHeaders(headers);

    assert.strictEqual(email.headers.subject, 'Test Email');
    assert.strictEqual(email.headers.from, 'sender@example.com');
    assert.strictEqual(email.headers.to, 'recipient@example.com');
  });

  it('should handle folded headers correctly', () => {
    const email = new Email();
    const headers = `Folded-Header: This is a\r\n folded header\r\n`;

    email.parseHeaders(headers);

    assert.strictEqual(email.headers['folded-header'],
        'This is a folded header');
  });

  it('should handle duplicate headers by storing them in an array', () => {
    const email = new Email();
    const headers = `X-Custom-Header: Value1\r\nX-Custom-Header: Value2\r\n`;

    email.parseHeaders(headers);

    assert.deepStrictEqual(email.headers['x-custom-header'],
        ['Value1', 'Value2']);
  });

  it('should ignore empty or invalid header lines', () => {
    const email = new Email();
    const headers = `Subject: Test\r\nInvalidHeaderWithoutColon\r\nTo: recipient@example.com\r\n`;

    email.parseHeaders(headers);

    // Check that the valid headers are parsed correctly
    assert.strictEqual(email.headers.subject, 'Test');
    assert.strictEqual(email.headers.to, 'recipient@example.com');

    // The invalid header line should not be present
    assert.strictEqual(email.headers['InvalidHeaderWithoutColon'], undefined);
  });
});

describe('Email.parseStream', () => {
  it('should parse headers and body correctly', async () => {
    const email = new Email();
    const rawEmail = `Subject: Test Email\r\nFrom: sender@example.com\r\n\r\nThis is the body of the email.`;

    const stream = createStreamFromString(rawEmail);

    // console.log('stream',stream);
    await email.parseMessage(stream);

    assert.strictEqual(email.headers.subject, 'Test Email');
    assert.strictEqual(email.headers.from, 'sender@example.com');
    assert.strictEqual(email.body, 'This is the body of the email.');
  });

  it('should handle a large body streamed in chunks', async () => {
    const email = new Email();
    const headers = `Subject: Large Email\r\nFrom: sender@example.com\r\n\r\n`;
    const body = 'This is a large body. '.repeat(1000); // Repeating to simulate a large body
    const rawEmail = headers + body;

    const stream = createStreamFromString(rawEmail);

    await email.parseMessage(stream);

    assert.strictEqual(email.headers.subject, 'Large Email');
    assert.strictEqual(email.headers.from, 'sender@example.com');
    assert.strictEqual(email.body, body);
  });

  it('should parse the subject correctly from the body using simpleParser',
      async () => {
        const email = new Email();
        const rawEmail = `Subject: Test Email Subject\r\nFrom: sender@example.com\r\n\r\nBody content.`;

        const stream = createStreamFromString(rawEmail);

        await email.parseMessage(stream);

        assert.strictEqual(email.subject, 'Test Email Subject');
      });

  it('should handle stream errors properly', async () => {
    const email = new Email();
    const stream = new Readable({
      read() {
        this.emit('error', new Error('Stream error'));
      },
    });

    try {
      await email.parseMessage(stream);
      assert.fail('parseStream did not reject as expected');
    } catch (err) {
      assert.strictEqual(err.message,
          'Error processing incoming email: Stream error');
    }
  });

  it('should handle folded headers correctly', async () => {
    const email = new Email();
    const rawEmail = `Subject: Folded\r\n header\r\nFrom: sender@example.com\r\n\r\nBody content.`;

    const stream = createStreamFromString(rawEmail);

    await email.parseMessage(stream);

    assert.strictEqual(email.headers.subject, 'Folded header');
    assert.strictEqual(email.headers.from, 'sender@example.com');
    assert.strictEqual(email.body, 'Body content.');
  });
});

describe('Email.headers', () => {
  it('should retrieve header as expected', () => {
    const email = new Email();
    const headers = 'headera: lowercase header\r\nHEADERB: UPPERCASE HEADER\r\n\r\n';
    email.parseHeaders(headers);
    email.addHeader('HeAdErC', 'Mixed Case Header');

    assert.strictEqual(email.getHeader('HEADERA'), 'lowercase header');
    assert.strictEqual(email.headers.headerb, 'UPPERCASE HEADER');
    assert.strictEqual(email.headers['headerc'], 'Mixed Case Header');
  });
});
