const fs = require('fs');
require('dotenv').config();

const tlsConfig = {
  key: fs.readFileSync(process.env.INBOX_TLS_KEY_PATH || process.env.TLS_KEY_PATH),
  cert: fs.readFileSync(process.env.INBOX_TLS_CERT_PATH || process.env.TLS_CERT_PATH),
  minVersion: process.env.INBOX_TLS_MIN_VERSION || process.env.TLS_MIN_VERSION,
  maxVersion: process.env.INBOX_TLS_MAX_VERSION || process.env.TLS_MAX_VERSION,
  ciphers: process.env.INBOX_TLS_CIPHERS || process.env.TLS_CIPHERS,
  handshakeTimeout: 5000,
};

module.exports = {tlsConfig};
