const userService = require('../services/userService');
const emailController = require('../controllers/emailController');

class SMTPRouter {

  handleRcptTo(address, session, callback) {
    if (!userService.userExists(address.address)) {
      const err = new Error('5.1.1 User unknown');
      err.responseCode = 550;
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
    try {
      console.log(`${session.remoteAddress} created ${session.id}`);
      await emailController.handleIncomingEmail(stream, session);
      console.log(session.id, 'Message accepted');
      callback(null, '2.6.0 Message accepted');
    } catch (e) {
      if (Object.keys(e).includes('responseCode'))
        console.error(session.id, e.responseCode, e.message);
      else
        console.error(session.id, e);
      callback(e);
    }
  }

  async handleConnect(session, callback) {
    if (process.env.SPAMHAUS_API_KEY) {
      const res = await fetch(
          `https://apibl.spamhaus.net/lookup/v1/ZEN/${session.remoteAddress}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${process.env.SPAMHAUS_API_KEY}`,
            },
          });
      if (res.status === 200) {
        console.error(`${session.remoteAddress} blacklisted by Spamhaus.`);
        return callback(new Error('IP blacklisted by Spamhaus <https://check.spamhaus.org/>'));
      }
    }
    return callback();
  }
}

module.exports = new SMTPRouter();
