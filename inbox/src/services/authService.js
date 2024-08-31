const mailAuth = require('../validators/mailAuth');

class AuthService {
  async validateEmail(message, session) {
    const error = new Error();
    error.responseCode = 550;

    const {dkim, spf, arc, dmarc} = await mailAuth.Validate(message, session);

    if (process.env.INBOX_AUTH.includes('spf') && spf.status.result !== 'pass') {
      error.message = '5.7.1 SPF check failed.';
      throw error;
    }

    if (process.env.INBOX_AUTH.includes('arc') && arc.status.result !== 'pass') {
      error.message = '5.7.1 ARC check failed.';
      console.log(error);
      throw error;
    }

    if (process.env.INBOX_AUTH.includes('dkim')) {
      for (const {status} of dkim.results) {
        if (status.result !== 'pass') {
          error.message = '5.7.1 DKIM check failed.';
          console.log(error);
          throw error;
        }
      }
    }

    if (process.env.INBOX_AUTH.includes('dmarc') && dmarc.status.result !== 'pass') {
      error.message = '5.7.1 DMARC check failed.';
      console.log(error);
      throw error;
    }

  }
}

module.exports = new AuthService();
