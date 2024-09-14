
class RspamdService {
  constructor(rspamdUrl = process.env.RSPAMD_URL || 'http://rspamd:11334') {
    this.rspamdUrl = rspamdUrl;
    this.password = process.env.RSPAMD_PASSWORD;
  }

  async checkForSpam(email) {
    try {
      const emailContent = `${email.serializeHeaders()}\r\n\r\n${email.body}`
      const buffer = Buffer.from(emailContent, 'utf8');
      const response = await fetch(`${this.rspamdUrl}/checkv2`, {
        method: 'POST',
        headers: {
          'Pass': 'all',
          'Content-Type': 'application/octet-stream',
          'Password': this.password,
        },
        body: buffer
      })
      return await response.json();
    } catch (error) {
      console.error('Error checking email for spam:', error);
      throw new Error('Spam check failed');
    }
  }
}

module.exports = RspamdService;
