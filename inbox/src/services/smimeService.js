import {exec} from 'child_process';
import fs from 'fs/promises';
import path from 'path';

 export async function encryptEmail(rcpt, email) {
    const rcptCert = path.join(process.env.CLIENT_CERT_PATH, `${rcpt}.pem`);
    const mailPath = path.join('/tmp', `encrypted-${Date.now()}.eml`);
    const tempInputPath = path.join('/tmp', `input-${Date.now()}.eml`);

    // Check if the recipient's certificate exists
    try {
      await fs.access(rcptCert);
    } catch (err) {
      throw new Error(`No certificate found for ${rcpt}`);
    }

    // Serialize headers
    const headersString = serializeHeaders(email.headers);
    const fullEmail = `${headersString}\r\n\r\n${email.body}`;

    try {
      // Write the email body to a temporary input file
      await fs.writeFile(tempInputPath, fullEmail);

      // Construct the OpenSSL command
      const opensslCmd = `openssl smime -encrypt -aes256 -in ${tempInputPath} -out ${mailPath} -outform PEM ${rcptCert}`;

      // Encrypt the email using OpenSSL
      const encryptedEmail = await new Promise((resolve, reject) => {
        exec(opensslCmd, async (error, stdout, stderr) => {
          if (error) {
            // Clean up the temporary input file in case of error
            await fs.unlink(tempInputPath).catch(() => {
            });
            return reject(new Error(`Encryption failed: ${stderr}`));
          }

          try {
            let encryptedEmail = await fs.readFile(mailPath, 'utf8');
            await fs.unlink(mailPath); // Clean up the temporary output file
            await fs.unlink(tempInputPath); // Clean up the temporary input file

            // Remove the first and last lines (BEGIN and END markers)
            const lines = encryptedEmail.split('\n');
            encryptedEmail = lines.slice(1, -2).join('\n');
            encryptedEmail += '\n';

            resolve(encryptedEmail);
          } catch (err) {
            await fs.unlink(tempInputPath).catch(() => {
            });
            await fs.unlink(mailPath).catch(() => {
            });
            reject(err);
          }
        });
      });

      // Set the S/MIME Content-Type and related headers
      email.headers['Content-Type'] = 'application/pkcs7-mime; name="smime.p7m"; smime-type=enveloped-data';
      email.headers['Content-Disposition'] = 'attachment; filename="smime.p7m"';
      email.headers['Content-Transfer-Encoding'] = 'base64';

      // Update the email body with the encrypted content
      email.body = encryptedEmail;

      return email;
    } catch (err) {
      throw new Error(`Failed to encrypt email: ${err.message}`);
    }
  }

  // Method to serialize headers
  function serializeHeaders(headers) {
    return Object.entries(headers).map(([key, value]) => {
      // Check if value is an object with value and params
      if (value && typeof value === 'object' && value.value) {
        let headerValue = value.value;
        if (value.params) {
          const paramsString = Object.entries(value.params).
              map(([paramKey, paramValue]) => `${paramKey}=${paramValue}`).
              join('; ');
          headerValue += `; ${paramsString}`;
        }
        return `${key}: ${headerValue}`;
      }
      // Otherwise, treat it as a simple string
      return `${key}: ${value}`;
    }).join('\r\n');
  }
