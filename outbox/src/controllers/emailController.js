const Email = require('../models/email');
const DKIM = require('../middleware/dkim');
const Send = require('../services/emailService');
const pgp = require('../middleware/pgp');

async function handleOutgoingEmail(stream, session) {
  try {
    const email = new Email({from: session.envelope.from});

    // Parse email data
    await Promise.all([
      email.parseStream(stream),
      email.parseSession(session),
    ]);

    const dkim = new DKIM({domainName: email.domain, selector: '_dkim'});
    await dkim.signEmail(email);

    await Send.processEmail(email, session);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

module.exports = handleOutgoingEmail;
