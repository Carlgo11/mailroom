import { describe, it } from 'node:test';
import assert from 'node:assert';
import signMessage, { parseBody, parseHeaders } from '../src/services/dkim.js';
import Email from '../src/models/email.js';

const mockIMF = 'From: sender@localhost\r\n' +
  'To: recipient@localhost\r\n' +
  'Subject: Test Email for DKIM Signing\r\n' +
  'Date: Mon, 13 Jan 2025 10:00:00 +0000\r\n' +
  'Message-ID: <0123456789abcdef@localhost>\r\n' +
  '\r\n' +
  'This is a test email for verifying DKIM signing.\r\n' +
  'It contains two lines\r\n';

const email = new Email();
await email.parseMessage(mockIMF);
email.from = 'sender@localhost';

describe('DKIM.parseBody', () => {
  it('Correct body hash', () => {
    const bodyHash = parseBody(email.body);
    assert.strictEqual(bodyHash,
      'F5Ax2kBXZpMvVPTgAkE8RJhN/4vXwutRzyopwHSgppM=');
  });
});

describe('DKIM.parseHeaders', () => {
  it('Canonicalized headers', () => {
    const canonicalizeHeaders = parseHeaders(email.headers, [
      'from',
      'to',
      'subject',
      'date',
      'message-id',
      'mime-version',
      'content-type',
      'content-transfer-encoding']);

    assert.ok(canonicalizeHeaders);
  });
});

describe('DKIM.signMessage', async () => {
  await it('Valid DKIM header', async () => {
    const path = new URL('.', import.meta.url).pathname;
    const signature = await signMessage(email, path, 'dkim-test');
    const expectedSignature = 'v=1; a=rsa-sha256; c=relaxed/relaxed; d=localhost; s=dkim-test; bh=F5Ax2kBXZpMvVPTgAkE8RJhN/4vXwutRzyopwHSgppM=; h=from:to:subject:date:message-id:mime-version:content-type:content-transfer-encoding; b=ouMUnKPPvh47u2A53hwFvkdGnrC6bXOglXP7gkFGti5sevKqZbyo0/Eyq9D98ID5ySKRp8NhQdbTrGRNpKPbtIkkIZUfDd0QQczx/1+OHjHmyYt/hDm7Z8VyvLmRj2lPw8z2nxa/qAYcpjaWkCbdnM56/00AWpcpPVXIOOWYok/dIIGdU8JDcnhJkZxFMJllTYqc8UN/TN0yWWgIxi25rcBvr2Jz8aDAdAX9+zAWq7I/4aA8WApmnX2MjSt8RRhgtqaFTv8RL6tfMdXQt+EZYixkfhwPrzG1ZdhsrLSGU+ybQ6X94CSlrpMMm255OtnAzQv2+ACn+Az7+eKdwoCFfg==;';

    assert.strictEqual(signature, expectedSignature);
  });
});