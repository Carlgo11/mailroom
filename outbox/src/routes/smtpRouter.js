const {authenticate} = require('../services/authService');
const handleOutgoingEmail = require('../controllers/emailController');

class SMTPRouter {

  handleMailFrom(address, session, callback) {
    callback();
  }

  async handleData(stream, session, callback) {
    try {
      await handleOutgoingEmail(stream, session);
      callback();
    }catch(e){
      callback(e);
    }
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
