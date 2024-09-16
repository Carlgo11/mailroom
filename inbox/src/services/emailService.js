import Email from '../models/email.js';
import authenticateMessage from './authService.js';
import processRspamd from './spamService.js';
import saveEmail from './mailboxService.js';
import {encryptEmail} from './smimeService.js';
import {userExists} from './userService.js';

export class EmailService {
  async processIncomingEmail(stream, session) {
    const email = new Email({
      id: session.id,
      from: session.envelope.mailFrom.address,
    });

    // Parse email data
    await Promise.all([
      email.parseStream(stream),
      email.parseSession(session),
    ]);

    await Promise.all([
      // Validate the email with SPF, DKIM, ARC, DMARC
      authenticateMessage(email.raw, session),
      // Check for spam using Rspamd
      processRspamd(email, session),
    ]);

    // Save the email for each recipient
    await Promise.all(
        email.to.map(async (rcpt) => {
          // rewrite any alias
          rcpt = await userExists(rcpt);

          try {
            let newEmail = JSON.parse(JSON.stringify(email));
            newEmail = await encryptEmail(rcpt, newEmail);
            newEmail.headers['Delivered-To'] = rcpt;

            // Save S/MIME encrypted email
            await saveEmail(rcpt, newEmail);
          } catch (e) {
            console.debug(e);
            // Save unencrypted email
            await saveEmail(rcpt, email);
          }
        }),
    );
  }
}

export default new EmailService();
