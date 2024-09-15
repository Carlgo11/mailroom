class SpamService {
  async processRspamd(email) {
    const log = await import('../models/logging.mjs');
    const {checkForSpam} = await import('../validators/rspamd.mjs');
    const rspamd = await checkForSpam(email);
    email.addHeader('X-Spam-Score', rspamd['score']);

    const error = new Error();
    switch (rspamd.action) {
      case 'reject':
        error.responseCode = 550;
        error.message = '5.7.1 Message rejected as spam';
        log.info('Message rejected as spam', email.id);
        throw error;
      case 'greylist':
        error.responseCode = 451;
        error.message = '4.7.1 Greylisting in effect, please try again later';
        log.info('Message greylisted', email.id);
        throw error;
      case 'soft reject':
        error.responseCode = 450;
        error.message = '4.7.1 Soft reject, please try again later';
        log.info('Message soft rejected', email.id);
        throw error;
      case 'add header':
        email.addHeader('X-Spam-Status', 'Yes');
        email.addHeader('X-Spam-Flag', 'YES');
        log.info('Message marked as spam', email.id);
        break;
      case 'rewrite subject':
        email.subject = `[SPAM] ${email.subject}`;
        email.removeHeader('subject');
        email.addHeader('subject', `[SPAM] ${email.subject}`);
        log.info('Subject marked as spam', email.id);
        break;
    }

    if (rspamd.milter?.add_headers) {
      Object.entries(rspamd.milter.add_headers).forEach(([name, {value}]) => {
        email.addHeader(name, value);
      });
    }
  }
}

module.exports = new SpamService();
