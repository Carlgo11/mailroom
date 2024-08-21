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
    disabledCommands: ['AUTH', 'RSET', 'HELP', 'VRFY', 'NOOP'],
    onConnect(session, callback) {
      console.log(`Client connected: ${session.remoteAddress}`);

      // Verify connection is for expected hostname
      if (session.servername !== process.env.INBOX_HOST)
        return callback(new Error('Unknown hostname'));

      callback();
    },
    onClose(session) {
      console.log(`Client disconnected: ${session.remoteAddress}`);
    },
  });

  server.on('error', (err) => {
    console.error('Error %s', err.message);
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
