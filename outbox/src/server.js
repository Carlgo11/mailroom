import {Server, Response, Logger, registerCommand} from '@carlgo11/smtp-server';
import fs from 'fs';
import { handleAuth } from './handlers/auth.js';

const server = Server({
  tlsOptions: {
    // key: fs.readFileSync(process.env.OUTBOX_TLS_KEY_PATH),
    // cert: fs.readFileSync(process.env.OUTBOX_CERT_PATH),
    handshakeTimeout: 5000,
    minVersion: 'TLSv1.3',
    maxVersion: 'TLSv1.3',
    ALPNProtocols: ['h2'],
  },


});
registerCommand('AUTH', handleAuth)
server.listen(5877, () => {
  const {address, family, port} = server.address();
  Logger.info(`SMTP Server listening on ${address}:${port} via ${family}`);
}).on('error', (err) => console.log(`${err}`));