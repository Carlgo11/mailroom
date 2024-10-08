import {Log} from '@carlgo11/smtp-server';
import {checkForSpam} from '../validators/rspamd.js';

export default async function processRspamd(email) {
  const rspamd = await checkForSpam(email);
  email.addHeader('X-Spam-Score', rspamd['score']);

  switch (rspamd.action) {
    case 'reject':
      Log.info('Message rejected as spam', email.id);
      throw new Response('Message rejected as spam', 550, [5,7,1]);
    case 'greylist':
      Log.info('Message greylisted', email.id);
      throw new Response('Greylisting in effect, please try again later', 451, [4,7,1])
    case 'soft reject':
      Log.info('Message soft rejected', email.id);
      throw new Response('Soft reject, please try again later', 450, [4,7,1]);
    case 'add header':
      email.addHeader('X-Spam-Status', 'Yes');
      email.addHeader('X-Spam-Flag', 'YES');
      Log.info('Message marked as spam', email.id);
      break;
    case 'rewrite subject':
      email.subject = `[SPAM] ${email.subject}`;
      email.removeHeader('subject');
      email.addHeader('subject', `[SPAM] ${email.subject}`);
      Log.info('Subject marked as spam', email.id);
      break;
  }

  if (rspamd.milter?.add_headers) {
    Object.entries(rspamd.milter.add_headers).forEach(([name, {value}]) => {
      email.addHeader(name, value);
    });
  }
}
