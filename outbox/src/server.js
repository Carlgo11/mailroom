import { Server, Logger, registerCommand } from '@carlgo11/smtp-server';
import fs from 'fs';
import { handleAuth } from './handlers/auth.js';
import handleMail from './handlers/mail.js';

const server = Server({
  tlsOptions: {
    key: fs.readFileSync(process.env.OUTBOX_TLS_KEY_PATH),
    cert: fs.readFileSync(process.env.OUTBOX_TLS_CERT_PATH),
    handshakeTimeout: 5000,
    minVersion: 'TLSv1.3',
    maxVersion: 'TLSv1.3',
    ALPNProtocols: ['h2'],
  },
  extensions: ['ENHANCEDSTATUSCODES', 'PIPELINING', 'AUTH PLAIN', '8BITMIME'],
  onMAILFROM: handleMail,

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

server.listen(5877, () => {
  const { address, family, port } = server.address();
  Logger.info(`SMTP Server listening on ${address}:${port} via ${family}`);
}).on('error', (err) => console.log(`${err}`));