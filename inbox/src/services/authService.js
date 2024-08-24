const mailAuth = require('../validators/mailAuth');

class AuthService {
  async validateEmail(message, session) {
    const error = new Error();
    error.responseCode = 550;

    const { dkim, spf, arc, headers,dmarc } = await mailAuth.Validate(message, session);

    if(process.env.NODE_ENV !== 'production')
      console.debug(headers);

    if (spf.status.result !== 'pass') {
      error.message = '5.7.1 SPF check failed.';
      throw error;
    }

    if (arc.status.result !== 'pass') {
      error.message = '5.7.1 ARC check failed.';
      console.log(error)
      throw error;
    }

    for (const {status} of dkim.results) {
      if (status.result !== 'pass') {
        error.message = '5.7.1 DKIM check failed.';
        console.log(error)
        throw error;
      }
    }

    if(dmarc.status.result !== 'pass'){
      error.message = '5.7.1 DMARC check failed.';
      console.log(error)
      throw error;
    }

  }
}

module.exports = new AuthService();
