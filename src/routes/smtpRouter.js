const userService = require('../services/userService');  // Import UserService
const emailService = require('../services/emailService');  // Import EmailService

class SMTPRouter {
  handleRcptTo(address, session, callback) {
      console.log(`RCPT TO: ${address.address}`);

      // Validate the recipient using the UserService
      if (!userService.userExists(address.address)) {
        const err = new Error('5.1.1 User unknown')
        err.responseCode = 550;
        return callback(err);
      }

      return callback();
  }

  handleMailFrom(address, session, callback) {
    if (!session.secure) {
      const err = new Error('Encryption Needed');
      err.responseCode = 523;
      return callback(err);
    }
    return callback();
  }

  handleData(stream, session, callback) {
    emailService.processIncomingEmail(stream, session).
        then(() => callback(null, 'Message accepted')).
        catch((err) => {
          console.error('Error processing email:', err);
          callback(new Error('Error processing email: ' + err.message));
        });
  }
}

module.exports = new SMTPRouter();
