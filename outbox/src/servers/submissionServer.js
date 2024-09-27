import log from '../services/logService.js';
import * as smtpRouter from '../routes/smtpRouter.js';
import {tlsConfig} from '../config/incomingTLS.js';
import Module from 'node:module';

const require = Module.createRequire(import.meta.url);
let server;

export async function startServer() {
  const SMTPServer = require('smtp-server').SMTPServer;
  server = new SMTPServer({
    ...tlsConfig,
    onData: await smtpRouter.handleData,
    onMailFrom: smtpRouter.handleMailFrom,
    onAuth: await smtpRouter.handleAuth,
    logger: process.env.NODE_ENV === 'development',
    onConnect(session, callback) {
      log.info(`${session.remoteAddress} connected. <${session.clientHostname}>`,
          session.id);
      return callback();
    },
    onClose(session) {
      log.info(`${session.remoteAddress} disconnected.`, session.id);
    },
    onSecure: (socket, session, callback) => {
      log.info(
          `connection upgraded to ${socket.getProtocol()} (${socket.getCipher().name})`,
          session.id);
      return callback();
    },
  });

  server.on('error', (err) => {
    if (err['library'] === 'SSL routines') {
      switch (err.code) {
        case 'ERR_SSL_NO_SHARED_CIPHER':
          log.info(
              `${err.remote} does not support any compatible TLS ciphers.`);
          break;
        case 'ERR_SSL_UNSUPPORTED_PROTOCOL':
          log.info(
              `${err.remote} does not support any compatible TLS versions.`);
          break;
        default:
          log.info(`TLS Error: ${err.reason} (${err.remote})`);
          break;
      }
    } else {
      log.error(`Error: ${err.reason || err}`);
    }
  });

  server.listen(process.env.OUTBOX_PORT, () =>
      log.info(`Outbox server listening on port ${process.env.OUTBOX_PORT}`));
}

function stopServer() {
  server.close(() => {
    console.log('Outbox server stopped');
    process.exit(0);
  });
}

process.on('SIGTERM', () => stopServer());
process.on('SIGINT', () => stopServer());

export default startServer;
