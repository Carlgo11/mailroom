import fs from 'fs';
import {createRequire} from 'module';
import Log from '../services/logService.js';
import {tlsConfig} from '../config/tls.js';
import {
  handleClose,
  handleConnect,
  handleData,
  handleMailFrom,
  handleRcptTo,
  handleSecure,
} from '../handlers/eventHandler.js';

// Use createRequire to import CommonJS modules in ESM
const require = createRequire(import.meta.url);
const {SMTPServer} = require('smtp-server');

const pidFile = '/var/tmp/inbox.pid';
let server;

export function startServer() {
  // Write the PID file
  fs.writeFileSync(pidFile, process.pid.toString(), {encoding: 'utf8'});

  try {
    // Create SMTP server instance
    server = new SMTPServer({
      ...tlsConfig,
      onConnect: (session, callback) => handleConnect(session, callback),
      onMailFrom: (address, session, callback) => handleMailFrom(address,
          session, callback),
      onRcptTo: (address, session, callback) => {
        handleRcptTo(address, session, callback).catch(callback);
      },
      onData: (stream, session, callback) => {
        handleData(stream, session, callback).catch(callback);
      },
      onClose: handleClose,
      onSecure: (socket, session, callback) => handleSecure(socket, session,
          callback),
      disabledCommands: ['AUTH', 'HELP'],
      logger: process.env.NODE_ENV === 'development',
    });
  } catch (e) {
    console.error(e);
    cleanup();
    process.exit(1);
  }

  // Attach error handler
  server.on('error', handleError);

  // Start listening
  server.listen(process.env.INBOX_PORT, () => {
    Log.info(`Inbox server listening on port ${process.env.INBOX_PORT}`);
  });
}

function handleError(err) {
  if (err.library === 'SSL routines') {
    switch (err.code) {
      case 'ERR_SSL_NO_SHARED_CIPHER':
        Log.info(
            `${err.remote} does not support any compatible TLS ciphers.`,
        );
        break;
      case 'ERR_SSL_UNSUPPORTED_PROTOCOL':
        Log.info(
            `${err.remote} does not support any compatible TLS versions.`,
        );
        break;
      default:
        Log.info(`TLS Error: ${err.reason} (${err.remote})`);
        break;
    }
  } else {
    Log.error(`Error: ${err.reason || err.message || err}`);
  }
}

function cleanup() {
  if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile);
    console.log(`PID file ${pidFile} removed.`);
  }
}

function stopServer() {
  server.close(() => {
    console.log('Inbox server stopped');
    cleanup();
    process.exit(0);
  });
}

// Handle process signals and exceptions
process.on('SIGTERM', stopServer);
process.on('SIGINT', stopServer);
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  cleanup();
  process.exit(1);
});

// Export the startServer function as default
export default startServer;
