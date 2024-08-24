const Email = require('../models/email');
const authService = require('./authService');
const spamService = require('./spamService');
const { saveEmail } = require('./mailboxService');

class EmailService {
  async processIncomingEmail(stream, session) {
    const email = new Email({ from: session.envelope.from });

    // Parse email data
    await Promise.all([
      email.parseStream(stream),
      email.parseSession(session)
    ]);

    await Promise.all([
      // Validate the email with SPF, DKIM, ARC, DMARC
      authService.validateEmail(email.raw, session),
      // Check for spam using Rspamd
      spamService.processRspamd(email),
    ]);

    // Save the email for each recipient
    for (const rcpt of email.to) {
      await saveEmail(rcpt, email);
    }
  }
}

module.exports = new EmailService();
