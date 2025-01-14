import crypto from 'crypto';
import fs from 'fs/promises';

function canonicalizeHeaders(headers, algo = 'relaxed') {
  if (algo === 'relaxed') {
    return headers.map(header => header.replace(/\s+/g, ' ').trim()).
      join('\r\n');
  }
  return headers.join('\r\n');
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
  // Normalize line endings to CRLF
  let normalizedBody = body.replace(/\r?\n/g, '\r\n');

  // Remove trailing whitespace from each line
  normalizedBody = normalizedBody.split('\r\n').
    map(line => line.replace(/\s+$/, '')).
    join('\r\n');

  // Remove trailing empty lines and ensure the body ends with a single CRLF
  normalizedBody = normalizedBody.replace(/(\r\n)*$/, '\r\n');

  return crypto.createHash('sha256').update(normalizedBody).digest('base64');
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
 * Creates DKIM signature header for a supplied email message (IMF text)
 *
 * @param {Email} email Email object containing headers and body.
 * @param {string} keyDir (Optional) Path to locate the appropriate DKIM private key file.
 * @param {string} selector (Optional) DKIM record selector.
 * @returns {Promise<string>} The constructed DKIM-Signature header.
 * @since 0.0.2
 */
export default async function signMessage(email, keyDir = '/cert/dkim/', selector = 'dkim') {
  const headers = email.headers;
  const body = email.body;
  const domain = email.from.split('@').slice(1)

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

  // Add the signature (b parameter) to the DKIM-Signature header
  return `${dkimHeader} b=${signature.toString('base64')};`;
}
