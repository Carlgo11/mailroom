const fs = require('fs');
require('dotenv').config();

const tlsConfig = {
  minVersion: process.env.OUTBOX_MX_TLS_MIN_VERSION,
  maxVersion: process.env.OUTBOX_MX_TLS_MAX_VERSION,
  ciphers: process.env.OUTBOX_TLS_MAX_VERSION || process.env.TLS_CIPHERS,
  handshakeTimeout: 5000,
};

module.exports = {tlsConfig};
