const SMTPServer = require('smtp-server').SMTPServer;
const smtpRouter = require('../routes/smtpRouter');
const {tlsConfig} = require('../config/incomingTLS');
let server;

function startServer() {
  server = new SMTPServer({
    ...tlsConfig,
    onData: smtpRouter.handleData,
    onMailFrom: smtpRouter.handleMailFrom,
    onAuth: smtpRouter.handleAuth,
    onConnect(session, callback) {
      console.log(`Client connected: ${session.remoteAddress}`);

      // Verify connection is for expected hostname
      if(session.servername !== process.env.OUTBOX_HOST)
        return callback(new Error('Unknown hostname'))

      if(session.transmissionType !== 'ESMTP') {
        const error = new Error('5.5.1 HELO not supported, use EHLO instead');
        error.responseCode = 502;
        return callback(error);
      }

      return callback();
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

  server.listen(process.env.OUTBOX_PORT, () => {
    console.log(`Submission Server is running on port ${process.env.OUTBOX_PORT}`);
  });
}

function stopServer(){
  server.close(() => {
    console.log('MX Server stopped');
    process.exit(0);
  });
}

process.on('SIGTERM', () => stopServer());
process.on('SIGINT', () => stopServer());

module.exports = {startServer: startServer};
