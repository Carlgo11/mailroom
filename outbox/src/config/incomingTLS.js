import fs from 'fs';
import 'dotenv/config';

export const tlsConfig = {
  secure: true,
  key: fs.readFileSync(process.env.OUTBOX_TLS_KEY_PATH || process.env.TLS_KEY_PATH),
  cert: fs.readFileSync(process.env.OUTBOX_TLS_CERT_PATH || process.env.TLS_CERT_PATH),
  ca: fs.readFileSync(process.env.OUTBOX_TLS_CA_PATH),
  requestCert: !!process.env.CLIENT_CERT_PATH,
  minVersion: process.env.OUTBOX_TLS_MIN_VERSION || process.env.TLS_MIN_VERSION,
  maxVersion: process.env.OUTBOX_TLS_MAX_VERSION || process.env.TLS_MAX_VERSION,
  ciphers: process.env.OUTBOX_TLS_MAX_VERSION || process.env.TLS_CIPHERS,
  handshakeTimeout: 5000,
  onSecure: (socket, session, callback) => {
    console.debug(JSON.stringify(session));
    return callback();
  },
};
