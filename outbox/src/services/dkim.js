import crypto from 'crypto';
import fs from 'fs/promises';

function canonicalizeHeaders(headers, algo = 'relaxed') {
  if (algo === 'relaxed') {
    return headers.map(header => header.replace(/\s+/g, ' ').trim()).
      join('\r\n');
  }
  return headers.join('\r\n');
}

function canonicalizeBody(body) {
  // Normalize line endings to CRLF
  let normalizedBody = body.replace(/\r?\n/g, '\r\n');

  // Remove trailing whitespace from each line
  normalizedBody = normalizedBody.split('\r\n').
    map(line => line.replace(/\s+$/, '')).
    join('\r\n');

  // Remove trailing empty lines and ensure the body ends with a single CRLF
  normalizedBody = normalizedBody.replace(/(\r\n)*$/, '\r\n');

  return normalizedBody;
}

export function parseHeaders(allHeaders, headersToSign) {
  if (typeof allHeaders === 'object') {
    let headersMap = {}
    Object.keys(allHeaders).map(name => {
      headersMap[name.toLowerCase()] = allHeaders[name];
    })

    const selectedHeaders = headersToSign
    .map(headerName => headersMap[headerName.toLowerCase()])
    .filter(Boolean); // Remove undefined headers

    return canonicalizeHeaders(selectedHeaders);
  } else {
    throw new Error('Expected headers to be a string');
  }
}

export function parseBody(body) {
  const canonicalBody = canonicalizeBody(body);
  return crypto.createHash('sha256').update(canonicalBody).digest('base64');
}

const headersToSign = [
  'from',
  'to',
  'subject',
  'date',
  'message-id',
  'mime-version',
  'content-type',
  'content-transfer-encoding',
];
/**
 * Signs an email message using the specified headers, body, domain, selector, and private key,
 * creating a DKIM-Signature header.
 *
 * @param {String} headers An array containing all email headers.
 * @param {string} body The body of the email message.
 * @param {string} domain The domain name used for the DKIM signature.
 * @param {string} selector The selector corresponding to the DNS entry of the DKIM key.
 * @param {String} keyPath The private key used to sign the email.
 * @return {string} The constructed DKIM-Signature header with the attached digital signature.
 * @throws {Error} If any headers listed in `headersToSign` are missing from the provided headers.
 */

/**
 *
 * @param {Email} email
 * @param {string} keyDir
 * @param {string} selector
 * @returns {Promise<string>}
 */
export default async function signMessage(email, keyDir = '/cert/dkim/', selector = 'dkim') {
  const headers = email.headers;
  const body = email.body;
  const addr = email.from.split('@').slice(1);
  const domain = addr

  // Load private key
  const privateKey = await fs.readFile(`${keyDir}${domain}.pem`, 'utf8');

  // Parse headers and body
  const parsedHeaders = parseHeaders(headers, headersToSign);
  const bodyHash = parseBody(body);

  // Construct DKIM-Signature header (excluding the signature)
  const dkimHeader = `v=1; a=rsa-sha256; c=relaxed/relaxed; d=${domain}; s=${selector}; bh=${bodyHash}; h=${headersToSign.join(':')};`;

  // Canonicalize and hash the signature header
  const signatureInput = `${parsedHeaders}\r\n${dkimHeader}`;
  const signature = crypto.sign('sha256', Buffer.from(signatureInput), privateKey);

  // Add the signature to the DKIM-Signature header
  return `${dkimHeader} b=${signature.toString('base64')};`;
}