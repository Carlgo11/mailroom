import authService from '../services/authService.js';
import handleOutgoingEmail from '../controllers/emailController.js';
import log from '../services/logService.js';

export function handleMailFrom(address, session, callback) {
  if (address.address !== session.user)
    return callback(new Error('Address differs from username'));

  return callback();
}

export async function handleData(stream, session, callback) {
  try {
    await handleOutgoingEmail(stream, session);
    return callback();
  } catch (e) {
    return callback(e);
  }
}

export async function handleAuth({username, password}, session, callback) {
  try {
    if (await authService.authenticate(username, password))
      return callback(null, {user: username});
  } catch (e) {
    log.error(e);
  }
  const error = new Error('5.7.8 Authentication failed');
  error.responseCode = 535;
  return callback(error);
}
