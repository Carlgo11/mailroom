import fs from 'fs';
import 'dotenv/config';

export const tlsOptions = {
  minVersion: process.env.OUTBOX_OUTGOING_TLS_MIN_VERSION,
  maxVersion: process.env.OUTBOX_OUTGOING_TLS_MAX_VERSION,
  ciphers: process.env.OUTBOX_OUTGOING_TLS_CIPHERS,
  handshakeTimeout: 5000,
  rejectUnauthorized: false,
};
