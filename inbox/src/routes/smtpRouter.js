import {handleIncomingEmail} from '../controllers/emailController.js';
import {userExists} from '../services/userService.js';
import * as log from '../models/logging.js';

export async function handleRcptTo(address, session, callback) {
  if (!await userExists(address.address)) {
    const err = new Error('5.1.1 mailbox not found');
    err.responseCode = 550;
    log.info(`Unknown recipient <${address.address}>`, session.id);
    return callback(err);
  }

  return callback();
}

export function handleMailFrom(address, session, callback) {
  if (session.secure) return callback();

  const e = new Error('Encryption Needed');
  e.responseCode = 523;
  return callback(e);
}

export async function handleData(stream, session, callback) {
  try {
    log.info('Client sending message', session.id);
    await handleIncomingEmail(stream, session);
    log.info(`Message accepted`, session.id);
    callback(null, '2.6.0 Message accepted');
  } catch (e) {
    log.info(`Message rejected. (${e.message})`, session.id);
    if (Object.keys(e).includes('responseCode'))
      console.error(session.id, e.responseCode, e.message);
    else
      console.error(session.id, e);
    callback(e);
  }
}

export async function handleConnect({remoteAddress, id}) {
  if (process.env.SPAMHAUS_API_KEY) {
    const res = await fetch(
        `https://apibl.spamhaus.net/lookup/v1/ZEN/${remoteAddress}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.SPAMHAUS_API_KEY}`,
          },
        });
    if (res.status === 200) {
      log.info(`${remoteAddress} blacklisted by Spamhaus.`, id);
      return new Error('IP blacklisted by Spamhaus <https://check.spamhaus.org/>');
    }
  }
  return null;
}
