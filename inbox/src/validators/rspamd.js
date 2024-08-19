
class RspamdService {
  constructor(rspamdUrl = process.env.RSPAMD_URL || 'http://rspamd:11334') {
    this.rspamdUrl = rspamdUrl;
    this.password = process.env.RSPAMD_PASSWORD;
  }

  async checkForSpam(email) {
    try {
      const headers = email.serialize();
      const headerString = Object.entries(headers).map(([key, value]) => `${key}: ${value}`).join('\r\n');
      const emailContent = `${headerString}\r\n\r\n${email.raw}`;

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
