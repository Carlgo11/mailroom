const axios = require('axios');

class RspamdService {
  constructor(rspamdUrl = process.env.RSPAMD_URL || 'http://rspamd:11334') {
    this.rspamdUrl = rspamdUrl;
    this.password = process.env.RSPAMD_PASSWORD;
  }

  async checkForSpam(email) {
    console.log(email)
    try {
      const buffer = Buffer.from(email.data, 'utf8');
      const response = await axios.post(`${this.rspamdUrl}/checkv2`, buffer,
          {
            headers: {
              ...email.serialize(),
              'Content-Type': 'application/octet-stream',
              'Password': this.password,
            },
          });

      return response.data;
    } catch (error) {
      console.error('Error checking email for spam:', error);
      throw new Error('Spam check failed');
    }
  }
}

module.exports = RspamdService;
