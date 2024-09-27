import Module from 'node:module';
import fs from 'fs/promises';

const require = Module.createRequire(import.meta.url);

export default class DKIMMiddleware {
  constructor(options) {
    this.domainName = options.domainName;  // The domain for which DKIM is being applied
    this.selector = options.selector;  // The DKIM selector (e.g., 'default' or 'dkim')
    this.algorithm = options.algorithm || 'ed25519-sha256';
    this.canonicalization = options.canonicalization || 'relaxed/relaxed';
  }

  async loadPrivateKey(path) {
    try {
      this.privateKey = await fs.readFile(path, 'utf8');
    } catch (error) {
      throw new Error(`Failed to load DKIM private key: ${error.message}`);
    }
  }

  async signEmail(email) {
    try {
      // Ensure the private key is loaded
      if (!this.privateKey) {
        const keyPath = `${process.env.OUTBOX_DKIM_PATH}/${email.domain}.key`;
        await this.loadPrivateKey(keyPath);
      }

      // Combine headers and body to create the full email message
      const headers = {
        from: email.headers.from,
        to: email.headers.to,
        subject: email.headers.subject,
        date: email.headers.date,
      };

      const headersString = email.serializeHeaders(headers);
      const fullEmail = `${headersString}\r\n\r\n${email.body}`;

      // Define the DKIM signature options
      const dkimOptions = {
        canonicalization: this.canonicalization,
        algorithm: this.algorithm,
        signatureData: [
          {
            signingDomain: this.domainName,
            selector: this.selector,
            privateKey: this.privateKey,
            canonicalization: this.canonicalization,
          }],
      };

      const {dkimSign} = require('mailauth/lib/dkim/sign');

      // Sign the email using mailauth's dkimSign
      const signResult = await dkimSign(fullEmail, dkimOptions);

      // Check for any errors during signing
      if (signResult.errors.length) {
        throw new Error(`DKIM signing errors: ${signResult.errors.join(', ')}`);
      }

      // Combine the DKIM signature with the original email
      return signResult.signatures.replace('DKIM-Signature:', '');
    } catch (error) {
      console.error(`Failed to DKIM sign email: ${error.message}`);
      return null;
    }
  }
}
