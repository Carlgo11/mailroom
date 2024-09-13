const userService = require('../services/userService');
const emailController = require('../controllers/emailController');

class SMTPRouter {

  async handleRcptTo(address, session, callback) {
    if (!await userService.userExists(address.address)) {
      const err = new Error('5.1.1 mailbox not found');
      const log = await import('../models/logging.mjs');
      err.responseCode = 550;
      log.info(`Unknown recipient <${address.address}>`, session.id);
      return callback(err);
    }

    return callback();
  }

  handleMailFrom(address, session, callback) {
    if (session.secure) return callback();

    const e = new Error('Encryption Needed');
    e.responseCode = 523;
    return callback(e);
  }

  async handleData(stream, session, callback) {
    const log = await import('../models/logging.mjs');
    try {
      log.info('Client sending message', session.id);
      await emailController.handleIncomingEmail(stream, session);
      log.info(`Message accepted`, session.id);
      callback(null, '2.6.0 Message accepted');
    } catch (e) {
      log.info(`Message rejected. (${e.message})`, session.id);
      if (Object.keys(e).includes('responseCode'))
        console.error(session.id, e.responseCode, e.message);
      else
        console.error(session.id, e);
      callback(e);
    }
  }

  async handleConnect({remoteAddress, id}) {
    const log = await import('../models/logging.mjs');
    if (process.env.SPAMHAUS_API_KEY) {
      const res = await fetch(
          `https://apibl.spamhaus.net/lookup/v1/ZEN/${remoteAddress}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${process.env.SPAMHAUS_API_KEY}`,
            },
          });
      if (res.status === 200) {
        log.info(`${remoteAddress} blacklisted by Spamhaus.`, id);
        return new Error(
            'IP blacklisted by Spamhaus <https://check.spamhaus.org/>');
      }
    }
    return null;
  }
}

module.exports = new SMTPRouter();
