const SMTPServer = require('smtp-server').SMTPServer;
const smtpRouter = require('../routes/smtpRouter');
const {tlsConfig} = require('../config/tls');
let server;

function startServer() {
  server = new SMTPServer({
    ...tlsConfig,
    onRcptTo: smtpRouter.handleRcptTo,
    onData: smtpRouter.handleData,
    onMailFrom: smtpRouter.handleMailFrom,
    logger: true,
    disabledCommands: ['AUTH', 'HELP'],
    onConnect(session, callback) {
      console.log(`Client connected: ${session.remoteAddress}`);

      // Verify connection is for expected hostname
      if (session.servername !== process.env.INBOX_HOST) {
        console.log(`Closing connection with ${session.remoteAddress}: Unknown hostname "${session.servername}".`);
        return callback(new Error('5.1.2 Unknown hostname'));
      }

      smtpRouter.handleConnect(session).then((r) => callback(r))
    },
    onClose(session) {
      console.log(`Client disconnected: ${session.remoteAddress}`);
    },
  });

  server.on('error', (err) => {
    if(err['library'] === 'SSL routines'){
      console.error(`TLS Error: ${err.reason} (${err.remote})`)
    }else {
      console.error('Error: %s', err.reason);
    }
  });

  server.listen(process.env.INBOX_PORT, () => {
    console.log(`Inbox server is running on port ${process.env.INBOX_PORT}`);
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
