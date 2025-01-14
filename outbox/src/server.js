import { Server, Logger, registerCommand } from '@carlgo11/smtp-server';
import fs from 'fs';
import handleAuth from './handlers/auth.js';
import handleMail from './handlers/mail.js';
import handleData from './handlers/data.js';

const server = Server({
  tlsOptions: {
    key: fs.readFileSync(process.env.OUTBOX_TLS_KEY_PATH),
    cert: fs.readFileSync(process.env.OUTBOX_TLS_CERT_PATH),
    handshakeTimeout: 5000,
    minVersion: process.env.OUTBOX_TLS_MIN_VERSION || process.env.TLS_MIN_VERSION,
    maxVersion: process.env.OUTBOX_TLS_MAX_VERSION || process.env.TLS_MAX_VERSION,
    requestOCSP: true,
  },
  logLevel: process.env.LOG_LEVEL || 'INFO',
  extensions: ['ENHANCEDSTATUSCODES', 'PIPELINING', 'AUTH PLAIN', '8BITMIME'],
  onMAILFROM: handleMail,
  onDATA: handleData,
});

function cleanup() {
  /*if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile);
    console.log(`PID file ${pidFile} removed.`);
  }*/
}

function stopServer() {
  server.close(() => {
    console.log('Inbox server stopped');
    cleanup();
    process.exit(0);
  });
}

registerCommand('AUTH', handleAuth);

// Handle process signals and exceptions
process.on('SIGTERM', stopServer);
process.on('SIGINT', stopServer);
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  cleanup();
  process.exit(1);
});

server.listen(process.env.OUTBOX_PORT, () => {
  const { address, family, port } = server.address();
  Logger.info(`SMTP Server listening on ${address}:${port} via ${family}`);
}).on('error', (err) => console.log(`${err}`));