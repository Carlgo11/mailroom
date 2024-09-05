import {exec} from 'child_process';
import {promises as fs} from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Paths
const CA_DIR = path.dirname(process.env.CLIENT_CERT_CA_CERT);
const TMP_DIR = '/tmp/';

// Helper to run OpenSSL commands
async function runCMD(command) {
  return new Promise((resolve, reject) => {
    exec(`openssl ${command}`, (error, stdout, stderr) => {
      if (error) {
        console.error(error, stderr || stdout);
        return reject(stderr || stdout);
      }
      return resolve(stdout);
    });
  });
}

export async function generateCertificate(username, password) {
  const keyFile = path.join(TMP_DIR, `${username}-key.pem`);
  const csrFile = path.join(TMP_DIR, `${username}-csr.pem`);
  const certFile = path.join(process.env.CLIENT_CERT_PATH, `${username}.pem`);
  const p12File = path.join(CA_DIR, `${username}.p12`);
  const caCert = process.env.CLIENT_CERT_CA_CERT;
  const cnfFile = path.join(CA_DIR, 'ca.cnf');

  try {
    // Generate ed25519 Private Key
    console.debug(`Generating ed25519 private key for ${username}...`);
    await runCMD(`genpkey -algorithm ed25519 -out "${keyFile}"`);

    // Generate CSR
    console.debug(`Creating CSR for ${username}...`);
    await runCMD(`req -new -key "${keyFile}" -out "${csrFile}" -subj "/CN=${username}" -config "${cnfFile}"`);

    // Sign the CSR with the CA certificate
    console.debug(`Signing CSR with the CA certificate for ${username}...`);
    await runCMD(`ca -config "${cnfFile}" -extensions req_ext -days 3650 -notext -md sha512 -in "${csrFile}" -out "${certFile}" -batch`);

    // Create a PKCS12 file (optional, depending on your needs)
    console.debug(`Creating PKCS12 file for ${username}...`);
    await runCMD(`pkcs12 -export -out "${p12File}" -inkey "${keyFile}" -in "${certFile}" -certfile "${caCert}" -name "${username} certificate" -password pass:${password}`);

    // Clean up CSR
    console.debug(`Cleaning up files...`);
    await fs.unlink(csrFile);
    await fs.unlink(keyFile);

    return p12File;
  } catch (error) {
    console.error(`Failed to generate certificate for ${username}:`, error);
    throw error;
  }
}