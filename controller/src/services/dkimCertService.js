import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import { resolve } from 'path';

async function execCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Validate domain according to RFC specifications
function validateDomain(domain) {
  const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;
  if (!domainRegex.test(domain)) {
    throw new Error(`Invalid domain name: ${domain}`);
  }
}

export async function generateDKIMKeys(domain, keySize = 4096) {
  try {
    validateDomain(domain);

    const keyPath = process.env.DKIM_KEY_PATH || '/certs/dkim';
    await fs.mkdir(keyPath, { recursive: true });

    const privkeyPath = resolve(`${keyPath}/${domain}.key`);
    const pubKeyPath = resolve(`${keyPath}/${domain}.pem`);

    // Generate private key
    await execCommand('openssl', ['genrsa', '-out', privkeyPath, keySize]);

    // Generate public key from the private key
    await execCommand('openssl', ['rsa', '-in', privkeyPath, '-pubout', '-out', pubKeyPath]);

    // Read the public key
    const pubKeyContent = await fs.readFile(pubKeyPath, 'utf8');

    // Format the DKIM DNS record
    return `v=DKIM1; k=rsa; p=${pubKeyContent.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '').trim()}`;
  } catch (error) {
    throw new Error(`Error generating DKIM keys: ${error.message}`);
  }
}

export async function fetchDKIMRecord(domain) {
  const keyPath = process.env.DKIM_KEY_PATH || '/certs/dkim';
  const pubKeyPath = resolve(`${keyPath}/${domain}.pem`);

  // Read the public key
  const pubKeyContent = await fs.readFile(pubKeyPath, 'utf8');

  // Format the DKIM DNS record
  return `v=DKIM1; k=rsa; p=${pubKeyContent.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '').trim()}`;
}