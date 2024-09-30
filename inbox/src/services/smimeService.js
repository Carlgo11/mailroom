import fs from 'fs/promises';
import path from 'path';
import {execFile} from 'child_process';
import {promisify} from 'util';

const execFileAsync = promisify(execFile);

export async function encryptEmail(rcpt, email) {
  const rcptCertPath = path.join(process.env.CLIENT_CERT_PATH, `${rcpt}.pem`);

  // Check if the recipient's certificate exists
  try {
    await fs.access(rcptCertPath);
  } catch (err) {
    throw new Error(`No certificate found for ${rcpt}`);
  }

  const tempInputPath = path.join('/tmp', `input-${Date.now()}.eml`);
  const tempOutputPath = path.join('/tmp', `encrypted-${Date.now()}.pem`);

  try {
    // Write the email body to a temporary input file
    await fs.writeFile(tempInputPath, email.full_email());

    // Construct the OpenSSL command
    const opensslArgs = [
      'smime', '-encrypt',
      '-aes256', // Encryption algorithm
      '-in', tempInputPath, // Input file
      '-out', tempOutputPath, // Output file
      '-outform', 'DER', // Output format for easier debugging
      rcptCertPath, // Recipient's certificate
    ];

    // Execute the OpenSSL command
    await execFileAsync('openssl', opensslArgs);

    // Read the encrypted content from the output file
    let encryptedEmail = await fs.readFile(tempOutputPath);

    // Clean up temporary files
    await Promise.all([
      fs.unlink(tempInputPath),
      fs.unlink(tempOutputPath),
    ]);

    // Set the S/MIME Content-Type and related headers
    email.headers['content-type'] = 'application/pkcs7-mime; name="smime.p7m"; smime-type=enveloped-data';
    email.headers['content-disposition'] = 'attachment; filename="smime.p7m"';
    email.headers['content-transfer-encoding'] = 'base64';

    // Update the email body with the encrypted content
    email.body = encryptedEmail.toString('base64');

    return email;
  } catch (err) {
    // Clean up temporary files if an error occurs
    await fs.unlink(tempInputPath).catch(() => {});
    await fs.unlink(tempOutputPath).catch(() => {});

    throw new Error(`Failed to encrypt email: ${err.message}`);
  }
}
