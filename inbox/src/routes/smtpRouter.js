import {handleIncomingEmail} from '../controllers/emailController.js';
import {userExists} from '../services/userService.js';
import Log from '../services/logService.js';
import Spamhaus from '../validators/spamhaus.js';

export async function handleRcptTo(address, session, callback) {
  if (!await userExists(address.address)) {
    const err = new Error('5.1.1 mailbox not found');
    err.responseCode = 550;
    Log.info(`Unknown recipient <${address.address}>`, session.id);
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
    Log.info('Client sending message', session.id);
    await handleIncomingEmail(stream, session);
    Log.info(`Message accepted`, session.id);
    callback(null, '2.6.0 Message accepted');
  } catch (e) {
    Log.info(`Message rejected. (${e.message})`, session.id);
    if (Object.keys(e).includes('responseCode'))
      console.error(session.id, e.responseCode, e.message);
    else
      console.error(session.id, e);
    callback(e);
  }
}

export async function handleConnect({remoteAddress, id}) {
  if (await Spamhaus.lookupIP(remoteAddress)) {
    Log.info(`${remoteAddress} blacklisted by Spamhaus.`, id);
    return new Error('IP blacklisted by Spamhaus <https://check.spamhaus.org/>');
  }
  return null;
}
