const {saveEmail} = require('../services/mailboxService');
const Email = require('../models/email');
const mailAuth = require('../validators/mailAuth');
const RspamdService = require('../validators/rspamd');

class EmailController {
  async handleIncomingEmail(stream, session) {
    return new Promise(async (resolve, reject) => {
      try {
        const email = new Email({from: session.envelope.from});
        await email.parseStream(stream);
        await email.parseSession(session);
        /*
        // Validate email
        const {dkim, spf, arc} = await mailAuth.Validate(stream, session);

        if (spf.status.result !== 'success') reject('SPF validation failed.');

        if (arc.status.result !== 'success') reject('ARC signature invalid.');

        for (const result of dkim.results) {
          if (result.status.result !== 'pass') reject('DKIM invalid.');
        }
*/
        const rspamdService = new RspamdService();
        const rspamd = await rspamdService.checkForSpam(email);
        switch (rspamd.action) {
          case 'reject':
            reject('Spam detected');
            break;
          case 'greylist':
            reject('Try again later');
            break;
          case 'soft reject':
            reject('Try again later');
            break;
          case 'add header':
            // TODO: Add support
            break;
          case 'rewrite subject':
            // TODO: Add support
            break;
        }
        for (const rcpt of email.to) {
          await saveEmail(rcpt, email);
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = new EmailController();
