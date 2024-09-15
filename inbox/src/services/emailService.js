const Email = require('../models/email');
const authService = require('./authService');
const spamService = require('./spamService');
const {saveEmail} = require('./mailboxService');
const {encryptEmail} = require('./smimeService');
const userService = require('./userService');
class EmailService {
  async processIncomingEmail(stream, session) {
    const email = new Email({id: session.id, from: session.envelope.mailFrom.address});

    // Parse email data
    await Promise.all([
      email.parseStream(stream),
      email.parseSession(session),
    ]);

    await Promise.all([
      // Validate the email with SPF, DKIM, ARC, DMARC
      authService.validateEmail(email.raw, session),
      // Check for spam using Rspamd
      spamService.processRspamd(email, session),
    ]);

    // Save the email for each recipient
    await Promise.all(
        email.to.map(async (rcpt) => {
          // rewrite any alias
          rcpt = await userService.userExists(rcpt);

          try {
            let newEmail = JSON.parse(JSON.stringify(email));
            newEmail = await encryptEmail(rcpt, newEmail);
            newEmail.headers['Delivered-To'] =  rcpt;

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

module.exports = new EmailService();
