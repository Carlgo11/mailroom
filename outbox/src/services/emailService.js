const SMTPConnection = require('nodemailer/lib/smtp-connection');
const dns = require('dnsService.mjs');
const tls = require('tls');
const types = [undefined, 'sha256', 'sha512'];

class EmailService {
  async processEmail(email) {
    const hosts = await dns.fetchMX(email.domain);
    for (const host of hosts) {
      const socket = tls.connect(25, host, {servername: host});

      const tlsa = await this.validateCert(socket, host);
      if (!tlsa) throw new Error('Invalid TLSA');

      const con = new SMTPConnection({
        host: host,
        port: 25,
        requireTLS: true,
        name: process.env.OUTBOX_HOST,
        socket,
      });

      const envelope = {
        from: email.from,
        to: email.to,
        use8BitMime: true,
      };

      const message = `${email.serializeHeaders()}\r\n\r\n${email.body}`;

      con.send(envelope, message, (err, info) => {
        if (!err) {
          // Log status
          console.log(info);
          con.quit();
          return true;
        } else {
          console.error(err.code, err.response, err.responseCode);
          con.quit();
        }
      });
    }
  }

  async validateCert(socket, hostname) {
    try {
      const cert = socket.getPeerCertificate();
      const records = await dns.fetchTLSA(hostname);
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
    }
    return false;
  }
}

module.exports = new EmailService();
