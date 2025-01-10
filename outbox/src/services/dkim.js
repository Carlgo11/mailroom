import crypto from 'crypto';

function canonicalizeHeaders(headers, algo = 'relaxed') {
  if (algo === 'relaxed') {
    return headers
    .map(header => header.replace(/\s+/g, ' ').trim())
    .join('\r\n');
  }
  return headers.join('\r\n');
}

function canonicalizeBody(body) {
  // Normalize line endings to CRLF
  let normalizedBody = body.replace(/\r?\n/g, '\r\n');

  // Remove trailing whitespace from each line
  normalizedBody = normalizedBody.split('\r\n')
  .map(line => line.replace(/\s+$/, ''))
  .join('\r\n');

  // Remove trailing empty lines and ensure the body ends with a single CRLF
  normalizedBody = normalizedBody.replace(/(\r\n)*$/, '\r\n');

  return normalizedBody;
}

/**
 * Signs an email message using the specified headers, body, domain, selector, and private key,
 * creating a DKIM-Signature header.
 *
 * @param {Array<string>} allHeaders An array containing all email headers.
 * @param {string} body The body of the email message.
 * @param {string} domain The domain name used for the DKIM signature.
 * @param {string} selector The selector corresponding to the DNS entry of the DKIM key.
 * @param {Object} privateKey The private key used to sign the email.
 * @param {Array<string>} headersToSign An array of header names to include in the DKIM signature.
 * @return {string} The constructed DKIM-Signature header with the attached digital signature.
 * @throws {Error} If any headers listed in `headersToSign` are missing from the provided headers.
 */
export default function signMessage(allHeaders, body, domain, selector, privateKey, headersToSign) {
  // Filter headers to include only those listed in `headersToSign`
  const headersMap = allHeaders.reduce((map, header) => {
    const [key] = header.split(':', 1);
    map[key.toLowerCase()] = header;
    return map;
  }, {});

  const selectedHeaders = headersToSign
  .map(headerName => headersMap[headerName.toLowerCase()])
  .filter(Boolean); // Remove undefined headers

  if (selectedHeaders.length !== headersToSign.length) {
    throw new Error('Some headers listed in `headersToSign` are missing from the message.');
  }

  // Canonicalize the body and selected headers
  const canonicalHeaders = canonicalizeHeaders(selectedHeaders);
  const canonicalBody = canonicalizeBody(body);

  // Hash the body
  const bodyHash = crypto.createHash('sha256').update(canonicalBody).digest('base64');

  // Construct DKIM-Signature header (excluding the signature)
  const dkimHeader = `v=1; a=rsa-sha256; c=relaxed/relaxed; d=${domain}; s=${selector}; bh=${bodyHash}; h=${headersToSign.join(':')};`;

  // Canonicalize and hash the signature header
  const signatureInput = `${canonicalHeaders}\r\n${dkimHeader}`;
  const signature = crypto.sign('sha256', Buffer.from(signatureInput), privateKey);

  // Add the signature to the DKIM-Signature header
  return `${dkimHeader} b=${signature.toString('base64')};`;
}