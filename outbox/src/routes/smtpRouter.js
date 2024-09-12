const {authenticate} = require('../services/authService');
const handleOutgoingEmail = require('../controllers/emailController');

class SMTPRouter {

  handleMailFrom(address, session, callback) {
    if (address.address !== session.user) {
      return callback(new Error('Address differs from username'));
    }
    return callback();
  }

  async handleData(stream, session, callback) {
    try {
      await handleOutgoingEmail(stream, session);
      callback();
    } catch (e) {
      callback(e);
    }
  }

  handleAuth(auth, session, callback) {
    const {username, password} = auth;
    const result = authenticate(username, password);
    if (result)
      return callback(null, {user: username});

    const error = new Error('5.7.8 Authentication failed');
    error.responseCode = 535;
    return callback(error);
  }
}

module.exports = new SMTPRouter();
