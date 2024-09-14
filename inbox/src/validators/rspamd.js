
class RspamdService {
  constructor(rspamdUrl = process.env.RSPAMD_URL || 'http://rspamd:11334') {
    this.rspamdUrl = rspamdUrl;
    this.password = process.env.RSPAMD_PASSWORD;
  }

  async checkForSpam(email,session) {
    try {
      const emailContent = `${email.serializeHeaders()}\r\n\r\n${email.body}`
      console.debug(emailContent)
      const buffer = Buffer.from(emailContent, 'utf8');
      const res = await fetch(`${this.rspamdUrl}/checkv2`, {
        method: 'POST',
        headers: {
          'Pass': 'all',
          'Content-Type': 'application/octet-stream',
          'Password': this.password,
          'From': email.from,
          'Rcpt': email.to.join(' '),
          'Queue-Id': email.id,
          'Helo': session.openingCommand,
          'IP': session.remoteAddress,
        },
        body: buffer
      })
      const response = await res.json();
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error checking email for spam:', error);
      throw new Error('Spam check failed');
    }
  }
}

module.exports = RspamdService;
