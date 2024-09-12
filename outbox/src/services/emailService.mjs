import tls from 'tls';
import net from 'net';
import {fetchMX, fetchTLSA} from './dnsService.mjs';
import Module from "node:module";

const types = [undefined, 'sha256', 'sha512'];

async function establishConnection(host, port, clientHost) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, host);

    socket.on('data', (data) => {
      const response = data.toString();
      console.debug('Server response:', response);

      if (response.startsWith('250')) {
        socket.write('STARTTLS\r\n');
      } else if (response.startsWith('220 Ready to start TLS')) {
        console.debug('Starting TLS connection');
        const secureSocket = tls.connect({
          socket: socket, servername: host,
          rejectUnauthorized: false,
        }, () => {
          console.debug('TLS connection established');
          resolve(secureSocket);
        });

        secureSocket.on('error', (err) => reject(err));

      } else if (response.startsWith('220')) {
        socket.write(`EHLO ${clientHost}\r\n`);
      }
    });

    socket.on('error', (err) => reject(err));

    socket.on('timeout', () => reject(new Error('Connection timeout')));

    socket.on('end', () => reject(new Error('Connection closed prematurely')));
  });
}

async function sendMessage(socket, {envelope, message}) {
  const require = Module.createRequire(import.meta.url);
  const SMTPConnection = require('nodemailer/lib/smtp-connection');
  // Initiate message transfer
  const con = new SMTPConnection({
    connection: socket,
    logger: process.env.NODE_ENV !== 'production',
    debug: process.env.NODE_ENV !== 'production',
    transactionLog: process.env.NODE_ENV !== 'production',
  });

  con.on('error', (e) => {
    console.error(e);
    throw e;
  });

  con.connect(() => {
    con.send(envelope, message, (err, info) => {
      if (err) {
        console.error('Error', err.code, err.response, err.responseCode);
        con.quit();
        throw err;
      } else {
        con.quit();
        return info;
      }
    });
  });
}

export async function processEmail(email, rcpt) {
  const domain = rcpt.split('@')[1];
  // const hosts = await fetchMX(domain);
const hosts = ['172.18.0.7'] //TODO: Remove from prod
  // Try each provided MX address
  for (let host of hosts) {

    // Create STARTTLS session with host
    const socket = await establishConnection(host, 25, 'localhost');

    // Validate TLSA records
    const tlsa = await validateCert(socket, host);
    if (!tlsa) throw new Error('Invalid TLSA');

    console.debug('Starting message transfer');
    const result = await sendMessage(socket, email.packageEmail());

    // Only send return if server accepted the message.
    if (result) return result;
  }
  // Return false if no hosts are found.
  return false;

}

async function validateCert(socket, hostname) {
  try {
    const cert = socket.getPeerCertificate();
    const records = await fetchTLSA(hostname);
    if (!records.length) return true;

    for (const record of records) {
      const [usage, selector, matchingType, dnsCert] = record;

      // Compare against the pubkey or entire cert
      const certificate = selector ?
          cert.pubkey.export({type: 'spki', format: 'der'}):
          cert.raw;

      const certHash = matchingType === 0 ?
          certificate.toString():
          crypto.createHash(types[matchingType]).
              update(certificate).
              digest('hex');

      // Match certificates
      switch (usage) {
        case 0: // PKIX-TA (CA constraint)
          return true;
        case 1: // PKIX-EE (End-entity with PKIX validation)
          if (socket.authorized && certHash === dnsCert) return true;
          break;
        case 2: // DANE-TA (Trust anchor assertion)
          if (cert.issuerCertificate &&
              cert.issuerCertificate.raw.toString('hex') ===
              dnsCert) return true;
          break;
        case 3: // DANE-EE (End-entity cert only)
          if (certHash === dnsCert) return true;
          break;
      }
    }
  } catch (_) {
    // Ignore any errors and just return false
  }
  return false;
}
