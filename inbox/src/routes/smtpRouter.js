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
      await emailController.handleIncomingEmail(stream, session);
      console.log(sessoin.id, 'Message accepted');
      callback(null, '2.0.0 OK: Message accepted for delivery');
    } catch (e) {
      if (Object.keys(e).includes('responseCode'))
        console.error(session.id, e.responseCode, e.message);
      else
        console.error(session.id, e);
      callback(e);
    }
  }
}

module.exports = new SMTPRouter();
