const SMTPServer = require('smtp-server').SMTPServer;
const smtpRouter = require('../routes/smtpRouter');
const {tlsConfig} = require('../config/tls');
let server;

async function startServer() {
  const log = await import('../models/logging.mjs');
  server = new SMTPServer({
    ...tlsConfig,
    onRcptTo: smtpRouter.handleRcptTo,
    onData: smtpRouter.handleData,
    onMailFrom: smtpRouter.handleMailFrom,
    // logger: true,
    disabledCommands: ['AUTH', 'HELP'],
    onConnect(session, callback) {
      log.info(`${session.remoteAddress} connected`,session.id);
      smtpRouter.handleConnect(session).then((r) => callback(r))
    },
    onClose(session) {
      log.info(`${session.remoteAddress} disconnected`,session.id);
    },
    onSecure: (socket, session, callback) => {
      log.info(`connection upgraded to ${socket.getProtocol()} (${socket.getCipher().name})`,session.id);
      return callback();
    },
  });

  server.on('error', (err) => {
    if(err['library'] === 'SSL routines'){
      if(err.code === 'ERR_SSL_UNSUPPORTED_PROTOCOL')
        log.info(`${err.remote} TLS negotiation failed.`)
      else
      log.debug(`TLS Error: ${err.reason} (${err.remote})`)
    }else {
      log.error('Error: %s', err.reason);
    }
  });

  server.listen(process.env.INBOX_PORT, () => {
    log.info(`Inbox server is listening on port ${process.env.INBOX_PORT}`);
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

module.exports = {startServer};
