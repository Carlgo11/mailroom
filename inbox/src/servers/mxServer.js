const SMTPServer = require('smtp-server').SMTPServer;
const smtpRouter = require('../routes/smtpRouter');
const {tlsConfig} = require('../config/mxTLS');

function startMXServer() {
  const server = new SMTPServer({
    ...tlsConfig,
    onRcptTo: smtpRouter.handleRcptTo,
    onData: smtpRouter.handleData,
    onMailFrom: smtpRouter.handleMailFrom,
    disabledCommands: ['AUTH', 'RSET', 'HELP', 'VRFY', 'NOOP'],
    onConnect(session, callback) {
      console.log(`Client connected: ${session.remoteAddress}`);

      // Verify connection is for expected hostname
      if(session.servername !== process.env.INBOX_HOST)
        return callback(new Error('Unknown hostname'));

      return callback();
    },
    onClose(session) {
      console.log(`Client disconnected: ${session.remoteAddress}`);
    },
  });

  server.on('error', (err) => {
    console.log('Error %s', err.message);
  });

  server.listen(process.env.INBOX_PORT, () => {
    console.log(`MX Server is running on port ${process.env.INBOX_PORT}`);
  });
}

module.exports = {startMXServer};
