import {Validate} from '../validators/mailAuth.js';
import Log from './logService.js';

export default async function authenticateMessage(email, id) {
  const error = new Error();
  error.responseCode = 550;

  const {dkim, spf, arc, dmarc} = await Validate(email);

  if (process.env.INBOX_AUTH.includes('spf') && spf.status.result !==
      'pass') {
    Log.info('SPF failed', id);
    throw new Response('SPF check failed', 550, [5, 7, 1]);
  }

  if (process.env.INBOX_AUTH.includes('arc') && arc.status.result !==
      'pass') {
    Log.info('ARC check failed', id);
    throw new Response('ARC check failed', 550, 5,7,1);
  }

  if (process.env.INBOX_AUTH.includes('dkim')) {
    for (const {status} of dkim.results) {
      if (status.result !== 'pass') {
        Log.info('DKIM check failed', id);
        throw new Response('DKIM check failed', 550, [5, 7, 1]);
      }
    }
  }

  if (process.env.INBOX_AUTH.includes('dmarc') && dmarc.status.result !==
      'pass') {
    Log.info('DMARC check failed', id);
    throw new Response('DMARC check failed', 550, [5, 7, 1]);
  }
}
