const SMTPServer = require('smtp-server').SMTPServer;
const smtpRouter = require('../routes/smtpRouter');
const {tlsConfig} = require('../config/incomingTLS');
let server;

async function startServer() {
  const log = await import('../models/logging.mjs');
  server = new SMTPServer({
    ...tlsConfig,
    onData: smtpRouter.handleData,
    onMailFrom: smtpRouter.handleMailFrom,
    onAuth: smtpRouter.handleAuth,
    logger: process.env.NODE_ENV === 'development',
    onConnect(session, callback) {
      log.info(`${session.remoteAddress} connected. <${session.clientHostname}>`, session.id);
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
          log.info(`${err.remote} does not support any compatible TLS ciphers.`);
          break;
        case 'ERR_SSL_UNSUPPORTED_PROTOCOL':
          log.info(`${err.remote} does not support any compatible TLS versions.`);
          break;
        default:
          log.info(`TLS Error: ${err.reason} (${err.remote})`);
          break;
      }
    } else {
      err.reason ?
          log.error(`Error: ${err.reason}`):
          log.error(err);
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

module.exports = {startServer: startServer};
