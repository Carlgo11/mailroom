const {dkimSign} = require('mailauth/lib/dkim/sign');
const fs = require('fs').promises;

class DKIMMiddleware {
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
    // Ensure the private key is loaded
    if (!this.privateKey) {
      const keyPath = `${process.env.OUTBOX_DKIM_PATH}/${email.domain}.pem`;
      await this.loadPrivateKey(keyPath);
    }

    // Combine headers and body to create the full email message
    const headers = {
      from: email.headers.from,
      to: email.headers.to,
      subject: email.headers.subject,
      date: email.headers.date,
    }
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
        },
      ],
    };

    try {
      // Sign the email using mailauth's dkimSign
      const signResult = await dkimSign(fullEmail, dkimOptions);

      // Check for any errors during signing
      if (signResult.errors.length) {
        throw new Error(`DKIM signing errors: ${signResult.errors.join(', ')}`);
      }

      // Combine the DKIM signature with the original email
      email.headers;
      return `${signResult.signatures}\r\n${fullEmail}`;
    } catch (error) {
      throw new Error(`Failed to DKIM sign email: ${error.message}`);
    }
  }
}

module.exports = DKIMMiddleware;
