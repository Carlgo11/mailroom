const fs = require('fs');
require('dotenv').config();

const tlsConfig = {
  secure: true,
  key: fs.readFileSync(process.env.TLS_KEY_PATH),
  cert: fs.readFileSync(process.env.TLS_CERT_PATH),
  ca: fs.readFileSync(process.env.TLS_CA_PATH),
  requestCert: true,
  minVersion: process.env.TLS_MIN_VERSION,
  maxVersion: process.env.TLS_MAX_VERSION,
  ciphers: process.env.TLS_CIPHERS,
  handshakeTimeout: 5000,
};

module.exports = {tlsConfig};
