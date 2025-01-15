import fs from 'fs';

export const tlsConfig = {
  key: fs.readFileSync(process.env.INBOX_COINTAINER_TLS_KEY),
  cert: fs.readFileSync(process.env.INBOX_COINTAINER_TLS_CERT),
  minVersion: process.env.INBOX_TLS_MIN_VERSION || process.env.TLS_MIN_VERSION,
  maxVersion: process.env.INBOX_TLS_MAX_VERSION || process.env.TLS_MAX_VERSION,
  ciphers: process.env.INBOX_TLS_CIPHERS || process.env.TLS_CIPHERS,
};
