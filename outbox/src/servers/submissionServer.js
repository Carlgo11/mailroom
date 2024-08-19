const SMTPServer = require('smtp-server').SMTPServer;
const smtpRouter = require('../routes/smtpRouter');
const {tlsConfig} = require('../config/tls');

function startServer() {
  const server = new SMTPServer({
    ...tlsConfig,
    onData: smtpRouter.handleData,
    onMailFrom: smtpRouter.handleMailFrom,
    onAuth: smtpRouter.handleAuth,
    onConnect(session, callback) {
      console.log(`Client connected: ${session.remoteAddress}`);

      // Verify connection is for expected hostname
      if(session.servername !== process.env.OUTBOX_HOST)
        return callback(new Error('Unknown hostname'))

      return callback();
    },
    onClose(session) {
      console.log(`Client disconnected: ${session.remoteAddress}`);
    },
  });

  server.on("error", (err) => {
    console.log("Error %s", err.message);
  });

  server.listen(process.env.OUTBOX_PORT, () => {
    console.log(`Submission Server is running on port ${process.env.OUTBOX_PORT}`);
  });
}

module.exports = {startServer: startServer};
