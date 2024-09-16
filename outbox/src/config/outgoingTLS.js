const fs = require('fs');
require('dotenv').config();

const tlsOptions = {
  minVersion: process.env.OUTBOX_OUTGOING_TLS_MIN_VERSION,
  maxVersion: process.env.OUTBOX_OUTGOING_TLS_MAX_VERSION,
  ciphers: process.env.OUTBOX_OUTGOING_TLS_CIPHERS,
  handshakeTimeout: 5000,
  rejectUnauthorized: false,
};

module.exports = {tlsOptions};
