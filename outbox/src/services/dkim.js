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

export default function signMessage(headers, body, domain, selector, privateKey) {
  // Canonicalize headers and body
  const canonicalHeaders = canonicalizeHeaders(headers);
  const canonicalBody = canonicalizeBody(body);
  // Hash the body
  const bodyHash = crypto.createHash('sha256').update(canonicalBody).digest('base64');
  // Construct DKIM-Signature header (excluding the signature)
  const dkimHeader = `v=1; a=rsa-sha256; c=relaxed/relaxed; d=${domain}; s=${selector}; bh=${bodyHash}; h=${headers.map(h => h.split(':')[0]).join(':')};`;

  // Canonicalize and hash the signature header
  const signatureInput = `${dkimHeader}\r\n${canonicalHeaders}`;
  const signature = crypto.sign('sha256', Buffer.from(signatureInput), privateKey);

  // Add the signature to the DKIM-Signature header
  return `${dkimHeader} b=${signature.toString('base64')};`;
}
