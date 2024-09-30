import Email from '../models/email.js';
import authenticateMessage from './authService.js';
import processRspamd from './spamService.js';
import saveEmail from './mailboxService.js';
import {encryptEmail} from './smimeService.js';
import {userExists} from './userService.js';
import Log from './logService.js';

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
      authenticateMessage(stream, session),
      // Check for spam using Rspamd
      processRspamd(email, session),
    ]);

    // Save the email for each recipient
    await Promise.all(
        email.to.map(async (rcpt) => {
          // rewrite any alias
          rcpt = await userExists(rcpt);

          try {
            const newEmail = await encryptEmail(rcpt, new Email(email));
            newEmail.headers['Delivered-To'] = rcpt;

            // Save S/MIME encrypted email
            await saveEmail(rcpt, newEmail);
          } catch (e) {
            Log.debug(`Unable to S/MIME sign message. Error: ${e}`,session.id)
            // Save unencrypted email
            await saveEmail(rcpt, email);
          }
        }),
    );
  }
}

export default new EmailService();
