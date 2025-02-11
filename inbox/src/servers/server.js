import fs from 'fs';
import {Server, Logger} from '@carlgo11/smtp-server';
import {tlsConfig as tlsOptions} from '../config/tls.js';
import {
  handleConnect,
  handleData, handleEhlo,
  handleMailFrom,
  handleRcptTo,
} from '../handlers/eventHandler.js';

let server;

export default function startServer() {
  // Write the PID file
  fs.writeFileSync(process.env.INBOX_PID, process.pid.toString(), {encoding: 'utf8'});

  try {
    // Create SMTP server instance
    server = new Server({
    tlsOptions,
      extensions: ['ENHANCEDSTATUSCODES', 'PIPELINING', 'REQUIRETLS', '8BITMIME'],
      greeting: process.env.INBOX_HOST,
      onRCPTTO: handleRcptTo,
      onMAILFROM: handleMailFrom,
      onEHLO: handleEhlo,
      onDATA: handleData,
      onConnect: handleConnect,
      logLevel: process.env.LOG_LEVEL,
      maxConnections: process.env.INBOX_MAX_CONNECTIONS,
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
  if (fs.existsSync(process.env.INBOX_PID)) {
    fs.unlinkSync(process.env.INBOX_PID);
    console.log(`PID file ${process.env.INBOX_PID} removed.`);
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
