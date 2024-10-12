import {Validate} from '../validators/mailAuth.js';
import {Log} from '@carlgo11/smtp-server';

export default async function authenticateMessage(email, id) {
  const inbox_auth = process.env.INBOX_AUTH;
  const {dkim, spf, arc, dmarc} = await Validate(email);

  if (inbox_auth.includes('spf') && spf.status.result !== 'pass') {
    Log.info('SPF failed', id);
    throw new Response('SPF validation failed', 550, [5, 7, 23]);
  }

  if (inbox_auth.includes('arc') && arc.status.result !== 'pass') {
    Log.info('ARC check failed', id);
    throw new Response('ARC validation failed', 550, 5, 7, 29);
  }

  if (inbox_auth.includes('dkim')) {
    for (const {status} of dkim.results) {
      if (status.result !== 'pass') {
        Log.info('DKIM check failed', id);
        throw new Response('No passing DKIM signature found', 550, [5, 7, 20]);
      }
    }
  }

  if (inbox_auth.includes('dmarc') && dmarc.status.result !== 'pass') {
    Log.info('DMARC check failed', id);
    throw new Response('DMARC check failed', 550, [5, 7, 1]);
  }
}
