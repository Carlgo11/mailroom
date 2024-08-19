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
        const error = new Error();
        console.debug(JSON.stringify(rspamd));

        email.addHeader('X-Spam-Score', rspamd['score']);

        switch (rspamd.action) {
          case 'reject':
            error.responseCode = 550;
            error.message = '5.7.1 Message rejected as spam'
            reject(error);
            break;
          case 'greylist':
            error.responseCode = 451;
            error.message = '4.7.1 Greylisting in effect, please try again later';
            reject(error);
            break;
          case 'soft reject':
            error.responseCode = 450;
            error.message = '4.7.1 Soft reject, please try again later'
            reject(error);
            break;
          case 'add header':
            email.addHeader('X-Spam-Status', 'Yes');
            email.addHeader('X-Spam-Flag', 'YES');
            break;
          case 'rewrite subject':
            email.subject = `[SPAM] ${email.subject}`;
            break;
        }

        if (rspamd.milter?.add_headers) {
          Object.entries(rspamd.milter.add_headers).
              forEach(([name, {value}]) => {
                email.addHeader(name, value);
              });
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
