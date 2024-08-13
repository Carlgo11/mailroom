const SMTPServer = require('smtp-server').SMTPServer;
const smtpRouter = require('./routes/smtpRouter'); // Correct import without { }
const {tlsConfig} = require('./config/tls');

function start() {
  const server = new SMTPServer({
    ...tlsConfig,
    useSMTPUTF8: false,
    disabledCommands: ['AUTH'],
    onData: smtpRouter.handleData,
    onRcptTo: smtpRouter.handleRcptTo,
    onMailFrom: smtpRouter.handleMailFrom,
    onConnect(session, callback) {
      console.log(`Client connected: ${session.remoteAddress}`);
      return callback();
    },
    onClose(session){
      console.log(`Client disconnected: ${session.remoteAddress}`);
    },
  });

  server.listen(process.env.SMTP_PORT, () => {
    console.log(`SMTP Server is running on port ${process.env.SMTP_PORT}`);
  });

  server.on('error', (err) => {
    console.error('SMTP Server Error:', err);
  });

  server.on('clientError', (err, socket) => {
    console.error('Client Error:', err);
    socket.end('400 Bad Request');
  });
}

module.exports = {start};
