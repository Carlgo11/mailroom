const fs = require('fs');
require('dotenv').config();

const tlsConfig = {
  key: fs.readFileSync(process.env.TLS_KEY_PATH),
  cert: fs.readFileSync(process.env.TLS_CERT_PATH),
  minVersion: process.env.TLS_MIN_VERSION,
  maxVersion: process.env.TLS_MAX_VERSION,
  ciphers: process.env.TLS_CIPHERS,
  handshakeTimeout: 5000,
  onSecure: (socket, session, callback) => {
    console.debug(`${session.remoteAddress} connection upgraded to TLS`);
    return callback();
  },
};

module.exports = {tlsConfig};
