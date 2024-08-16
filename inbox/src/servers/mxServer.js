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
      return callback();
    },
    onClose(session) {
      console.log(`Client disconnected: ${session.remoteAddress}`);
    },
  });

  server.on('error', (err) => {
    console.log('Error %s', err.message);
  });

  server.listen(process.env.MX_PORT, () => {
    console.log(`MX Server is running on port ${process.env.MX_PORT}`);
  });
}

module.exports = {startMXServer};
