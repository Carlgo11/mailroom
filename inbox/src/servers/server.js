import * as log from '../models/logging.js';
import * as smtpRouter from '../routes/smtpRouter.js';
import {tlsConfig} from '../config/tls.js';
import Module from "node:module";

const require = Module.createRequire(import.meta.url);
let server;

export async function startServer() {
  const SMTPServer = require('smtp-server').SMTPServer;
  server = new SMTPServer({
    ...tlsConfig,
    onRcptTo: smtpRouter.handleRcptTo,
    onData: smtpRouter.handleData,
    onMailFrom: smtpRouter.handleMailFrom,
    logger: process.env.NODE_ENV === 'development',
    disabledCommands: ['AUTH', 'HELP'],
    onConnect(session, callback) {
      log.info(`${session.remoteAddress} connected. <${session.clientHostname}>`,session.id);
      smtpRouter.handleConnect(session).then((r) => callback(r))
    },
    onClose(session) {
      log.info(`${session.remoteAddress} disconnected.`,session.id);
    },
    onSecure: (socket, session, callback) => {
      log.info(`connection upgraded to ${socket.getProtocol()} (${socket.getCipher().name})`,session.id);
      return callback();
    },
  });

  server.on('error', (err) => {
    if (err['library'] === 'SSL routines') {
      switch(err.code){
        case 'ERR_SSL_NO_SHARED_CIPHER':
          log.info(`${err.remote} does not support any compatible TLS ciphers.`)
          break;
        case 'ERR_SSL_UNSUPPORTED_PROTOCOL':
          log.info(`${err.remote} does not support any compatible TLS versions.`)
          break;
        default:
          log.info(`TLS Error: ${err.reason} (${err.remote})`)
          break;
      }
    } else {
      log.error('Error: %s', err.reason);
    }
  });

  server.listen(process.env.INBOX_PORT, () => {
    log.info(`Inbox server listening on port ${process.env.INBOX_PORT}`);
  });
}

function stopServer() {
  server.close(() => {
    console.log('Inbox server stopped');
    process.exit(0);
  });
}

process.on('SIGTERM', () => stopServer());
process.on('SIGINT', () => stopServer());

export default startServer;