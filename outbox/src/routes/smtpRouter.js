const emailController = require('../controllers/emailController');
const {authenticate} = require('../services/authService');

class SMTPRouter {

  handleMailFrom(address, session, callback) {
    callback();
  }

  async handleData(stream, session, callback) {
    callback();
  }

  handleAuth(auth, session, callback) {
    const {username, password} = auth;
    const result = authenticate(username, password);
    if (result)
      callback(null, {user: auth.username});
    else
      callback(new Error('Authentication failed'));
  }
}

module.exports = new SMTPRouter();
