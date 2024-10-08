import pgp from '../middleware/pgp.js';
import Email from '../models/email.js';
import DKIM from '../middleware/dkim.js';

export default async function handleOutgoingEmail(stream, session) {
  try {
    const email = new Email({from: session.envelope.from});

    // Parse email data
    await Promise.all([
      email.parseStream(stream),
      email.parseSession(session),
    ]);

    const dkim = new DKIM({domainName: email.domain, selector: '_dkim'});
    const dkimSig = await dkim.signEmail(email);
    if (dkimSig) email.addHeader('DKIM-Signature', dkimSig);

    const {processEmail} = await import('../services/smtpService.js');

    for (const rcpt of email.to) {
      const key = await pgp.find(rcpt.replace(/([<>])/g, ''));
      if (key) {
        const boundary = email.id.split('.')[1];
        const body = await pgp.encrypt(email, key);
        email.body = `--${boundary}\r\nContent-Type: application/pgp-encrypted\r\n\r\nVersion: 1\r\n\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n${body}\r\n--${boundary}--`;
        email.addHeader('content-type',
            `multipart/encrypted; protocol="application/pgp-encrypted"; boundary="${boundary}"`);
      }
      await processEmail(email, rcpt);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}
