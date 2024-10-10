import fs from 'fs';
import {Listen, startSMTPServer, Log} from '@carlgo11/smtp-server';
import {tlsConfig as tlsOptions} from '../config/tls.js';
import {
  handleConnect,
  handleData, handleEhlo,
  handleMailFrom,
  handleRcptTo,
} from '../handlers/eventHandler.js';

// Use createRequire to import CommonJS modules in ESM
const pidFile = '/var/tmp/inbox.pid';
let server;

export function startServer() {
  // Write the PID file
  fs.writeFileSync(pidFile, process.pid.toString(), {encoding: 'utf8'});

  try {
    // Create SMTP server instance
    server = new startSMTPServer({
    tlsOptions,
      onRCPTTO: async (address, session) => await handleRcptTo(address, session),
      onMAILFROM: async (address, session) => await handleMailFrom(address, session),
      onEHLO: async (domain, session) => await handleEhlo(domain, session),
      onDATA: async (message, session) => await handleData(message, session),
      onConnect: async(session) => await handleConnect(session).catch(e => {
        session.send(e);
        session.socket.end();
      }),
      logLevel: process.env.LOG_LEVEL || 'INFO',
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
