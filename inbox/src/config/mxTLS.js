const fs = require('fs');
require('dotenv').config();

const tlsConfig = {
  key: fs.readFileSync(process.env.TLS_KEY_PATH),
  cert: fs.readFileSync(process.env.TLS_CERT_PATH),
  authOptional: true,  // Allow authentication to be controlled by SMTPRouter
  minVersion: 'TLSv1.3',
  maxVersion: 'TLSv1.3',
  onSecure: (socket, session, callback) => {
    console.debug(`${session.remoteAddress} connection upgraded to TLS`);
    return callback();
  },
};

module.exports = {tlsConfig};
