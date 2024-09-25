import Log from '../services/logService.js';
import * as smtpRouter from '../routes/smtpRouter.js';
import {tlsConfig} from '../config/tls.js';
import Module from 'node:module';

const require = Module.createRequire(import.meta.url);
let server;

export function startServer() {
  const SMTPServer = require('smtp-server').SMTPServer;
  server = new SMTPServer({
    ...tlsConfig,
    onRcptTo: smtpRouter.handleRcptTo,
    onData: smtpRouter.handleData,
    onMailFrom: smtpRouter.handleMailFrom,
    Logger: process.env.NODE_ENV === 'development',
    disabledCommands: ['AUTH', 'HELP'],
    onConnect(session, callback) {
      Log.info(
          `${session.remoteAddress} connected. <${session.clientHostname}>`,
          session.id);
      smtpRouter.handleConnect(session).then((r) => callback(r)).catch(e => {
        Log.info(e.message, session.id);
        callback(e);
      });
    },
    onClose(session) {
      Log.info(`${session.remoteAddress} disconnected.`, session.id);
    },
    onSecure: (socket, session, callback) => {
      Log.info(
          `connection upgraded to ${socket.getProtocol()} (${socket.getCipher().name})`,
          session.id);
      return callback();
    },
  });

  server.on('error', (err) => {
    if (err['library'] === 'SSL routines') {
      switch (err.code) {
        case 'ERR_SSL_NO_SHARED_CIPHER':
          Log.info(
              `${err.remote} does not support any compatible TLS ciphers.`);
          break;
        case 'ERR_SSL_UNSUPPORTED_PROTOCOL':
          Log.info(
              `${err.remote} does not support any compatible TLS versions.`);
          break;
        default:
          Log.info(`TLS Error: ${err.reason} (${err.remote})`);
          break;
      }
    } else {
      Log.error(`Error: ${err.reason || err}`);
    }
  });

  server.listen(process.env.INBOX_PORT, () => {
    Log.info(`Inbox server listening on port ${process.env.INBOX_PORT}`);
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