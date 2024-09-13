const mailAuth = require('../validators/mailAuth');

class AuthService {
  async validateEmail(message, session) {
    const log = await import('../models/logging.mjs');
    const error = new Error();
    error.responseCode = 550;

    const {dkim, spf, arc, dmarc} = await mailAuth.Validate(message, session);

    if (process.env.INBOX_AUTH.includes('spf') && spf.status.result !== 'pass') {
      error.message = '5.7.1 SPF check failed.';
      log.info('SPF failed',session.id)
      throw error;
    }

    if (process.env.INBOX_AUTH.includes('arc') && arc.status.result !== 'pass') {
      error.message = '5.7.1 ARC check failed.';
      log.info('ARC check failed', session.id);
      throw error;
    }

    if (process.env.INBOX_AUTH.includes('dkim')) {
      for (const {status} of dkim.results) {
        if (status.result !== 'pass') {
          error.message = '5.7.1 DKIM check failed.';
          log.info('DKIM check failed',session.id);
          throw error;
        }
      }
    }

    if (process.env.INBOX_AUTH.includes('dmarc') && dmarc.status.result !== 'pass') {
      error.message = '5.7.1 DMARC check failed.';
      log.info('DMARC check failed',session.id);
      throw error;
    }
  }
}

module.exports = new AuthService();
