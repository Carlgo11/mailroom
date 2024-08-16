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
      callback();
    },
    onClose(session) {
      console.log(`Client disconnected: ${session.remoteAddress}`);
    },
  });

  server.on("error", (err) => {
    console.log("Error %s", err.message);
  });


  server.listen(process.env.SUBMISSION_PORT, () => {
    console.log(`Submission Server is running on port ${process.env.SUBMISSION_PORT}`);
  });
}

module.exports = {startServer: startServer};
