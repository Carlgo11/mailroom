const mailAuth = require('../validators/mailAuth');

class AuthService {
  async validateEmail(email, stream, session) {
    const error = new Error();
    error.responseCode = 550;

    const { dkim, spf, arc } = await mailAuth.Validate(stream, session);

    if (spf.status.result !== 'success') {
      error.message = '5.7.1 SPF check failed.';
      throw error;
    }

    if (arc.status.result !== 'success') {
      error.message = '5.7.1 ARC check failed.';
      throw error;
    }

    for (const result of dkim.results) {
      if (result.status.result !== 'pass') {
        error.message = '5.7.1 DKIM check failed.';
        throw error;
      }
    }
  }
}

module.exports = new AuthService();
