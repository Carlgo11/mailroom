import {Validate} from '../validators/mailAuth.js';
import Log from './logService.js';

export default async function authenticateMessage(message, session) {
  const error = new Error();
  error.responseCode = 550;

  const {dkim, spf, arc, dmarc} = await Validate(message, session);

  if (process.env.INBOX_AUTH.includes('spf') && spf.status.result !==
      'pass') {
    error.message = '5.7.1 SPF check failed.';
    Log.info('SPF failed', session.id);
    throw error;
  }

  if (process.env.INBOX_AUTH.includes('arc') && arc.status.result !==
      'pass') {
    error.message = '5.7.1 ARC check failed.';
    Log.info('ARC check failed', session.id);
    throw error;
  }

  if (process.env.INBOX_AUTH.includes('dkim')) {
    for (const {status} of dkim.results) {
      if (status.result !== 'pass') {
        error.message = '5.7.1 DKIM check failed.';
        Log.info('DKIM check failed', session.id);
        throw error;
      }
    }
  }

  if (process.env.INBOX_AUTH.includes('dmarc') && dmarc.status.result !==
      'pass') {
    error.message = '5.7.1 DMARC check failed.';
    Log.info('DMARC check failed', session.id);
    throw error;
  }
}
