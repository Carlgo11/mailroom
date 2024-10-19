import fs from 'fs';
import {Server, Logger} from '@carlgo11/smtp-server';
import {tlsConfig as tlsOptions} from '../config/tls.js';
import {
  handleConnect,
  handleData, handleEhlo,
  handleMailFrom,
  handleRcptTo,
} from '../handlers/eventHandler.js';

const pidFile = '/var/tmp/inbox.pid';
let server;

export default function startServer() {
  // Write the PID file
  fs.writeFileSync(pidFile, process.pid.toString(), {encoding: 'utf8'});

  try {
    // Create SMTP server instance
    server = new Server({
    tlsOptions,
      extensions: ['ENHANCEDSTATUSCODES', 'PIPELINING', 'REQUIRETLS', 'ONEX', '8BITMIME'],
      greeting: process.env.INBOX_HOST,
      onRCPTTO: async (address, session) => await handleRcptTo(address, session),
      onMAILFROM: async (address, session, ext) => await handleMailFrom(address, session, ext),
      onEHLO: async (domain, session) => await handleEhlo(domain, session),
      onDATA: async (message, session) => await handleData(message, session),
      onConnect: async(session) => await handleConnect(session),
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
    Logger.info(`Inbox server listening on port ${process.env.INBOX_PORT}`);
  });
}

function handleError(err) {
  if (err.library === 'SSL routines') {
    switch (err.code) {
      case 'ERR_SSL_NO_SHARED_CIPHER':
        Logger.info(
            `${err.remote} does not support any compatible TLS ciphers.`,
        );
        break;
      case 'ERR_SSL_UNSUPPORTED_PROTOCOL':
        Logger.info(
            `${err.remote} does not support any compatible TLS versions.`,
        );
        break;
      default:
        Logger.info(`TLS Error: ${err.reason} (${err.remote})`);
        break;
    }
  } else {
    Logger.error(`Error: ${err.reason || err.message || err}`);
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
