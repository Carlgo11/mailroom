const {saveEmailToInbox} = require('../services/mailboxService');
const Email = require('../models/email');
const mailAuth = require('../validators/mailAuth');

class EmailController {
  async handleIncomingEmail(stream, session) {
    return new Promise(async (resolve, reject) => {
      try {
        const email = new Email({from: session.envelope.from});
        await email.parseStream(stream);

        session.envelope.rcptTo.map(recipient => {
          return email.addRecipient(recipient);
        });

        // Validate email
        const {dkim, spf, arc} = await mailAuth.Validate(stream, session);

        if (spf.status.result !== 'success') reject('SPF validation failed.');

        if (arc.status.result !== 'success') reject('ARC signature invalid.');

        for (const result of dkim.results) {
          if (result.status.result !== 'pass') reject('DKIM invalid.');
        }

        saveEmailToInbox();
        resolve();

      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = new EmailController();
