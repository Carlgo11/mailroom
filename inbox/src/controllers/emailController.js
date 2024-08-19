const emailService = require('../services/emailService');

class EmailController {
  async handleIncomingEmail(stream, session) {
    try {
      await emailService.processIncomingEmail(stream, session);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

module.exports = new EmailController();
