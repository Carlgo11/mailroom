import {handleIncomingEmail} from '../controllers/emailController.js';
import {userExists} from '../services/userService.js';
import Log from '../services/logService.js';
import Spamhaus from '../validators/spamhaus.js';
import ipScore from '../validators/ipScore.js';
import ipQS from '../validators/ipQS.js';

/**
 * Handles the RCPT TO command during SMTP transaction.
 *
 * @param {Object} address - The address object containing recipient's email.
 * @param {Object} session - The session object for the SMTP transaction.
 * @param {Function} callback - The callback to signal success or failure.
 * @returns Function - Returns callback
 */
export async function handleRcptTo(address, session, callback) {
  try {
    const recipientExists = await userExists(address.address);
    if (!recipientExists) {
      Log.info(`Unknown recipient <${address.address}>`, session.id);
      const err = new Error('5.1.1 Mailbox not found');
      err.responseCode = 550;
      return callback(err);
    }
    return callback();
  } catch (err) {
    Log.error(`Error in handleRcptTo: ${err.message}`, session.id);
    return callback(err);
  }
}

/**
 * Handles the MAIL FROM command during SMTP transaction.
 *
 * @param {Object} address - The address object containing sender's email.
 * @param {Object} session - The session object for the SMTP transaction.
 * @param {Function} callback - The callback to signal success or failure.
 * @returns Function - Returns callback
 */
export function handleMailFrom(address, session, callback) {
  if (session.secure) {
    return callback();
  }
  const err = new Error('5.7.0 Encryption required');
  err.responseCode = 530;
  Log.info('Encryption required for MAIL FROM', session.id);
  return callback(err);
}

/**
 * Handles the DATA command during SMTP transaction.
 *
 * @param {Object} stream - The stream object containing the email content.
 * @param {Object} session - The session object for the SMTP transaction.
 * @param {Function} callback - The callback to signal success or failure.
 * @returns Function - Returns callback
 */
export async function handleData(stream, session, callback) {
  try {
    Log.info('Client sending message', session.id);
    await handleIncomingEmail(stream, session);
    Log.info('Message accepted', session.id);
    return callback(null, '2.6.0 Message accepted');
  } catch (err) {
    Log.error(`Message rejected: ${err.message}`, session.id);
    if ('responseCode' in err) {
      return callback(err);
    } else {
      const error = new Error('5.0.0 Internal server error');
      error.responseCode = 554;
      return callback(error);
    }
  }
}

/**
 * Handles the initial connection to the SMTP server.
 *
 * @param {Object} session - The session object containing connection details.
 * @param {Function} callback - The callback to signal connection acceptance or rejection.
 * @returns Function - Returns callback
 */
export function handleConnect({remoteAddress, id, clientHostname}, callback) {
  Log.info(`${remoteAddress} connected. <${clientHostname}>`, id);
  validateConnection(remoteAddress, id).
      then(() => callback()) // No error, proceed
      .catch((err) => callback(err)); // Pass error to callback
}

/**
 * Validates the IP address of the connecting client against blacklists and fraud score services.
 *
 * @param {string} remoteAddress - The IP address of the connecting client.
 * @param {string} id - The session ID for logging.
 * @returns {Promise<boolean>} Resolves to true if validation passes, otherwise throws an error.
 * @throws {Error} Throws an error if the IP address is blacklisted or has a high fraud score.
 */
async function validateConnection(remoteAddress, id) {
  const ipqsScoreLimit = parseInt(process.env.IPQS_SCORE_LIMIT, 10) || 50;

  const [spamhausListed, ipqsScore, ipscore] = await Promise.all([
    Spamhaus.lookupIP(remoteAddress),
    ipQS.lookupIP(remoteAddress),
    ipScore.lookupIP(remoteAddress),
  ]);

  if (spamhausListed) {
    Log.info(`${remoteAddress} blacklisted by Spamhaus`, id);
    const err = new Error('5.7.1 IP blacklisted by Spamhaus');
    err.responseCode = 554;
    throw err;
  }

  if (ipqsScore > ipqsScoreLimit) {
    Log.info(`${remoteAddress} has high IPQS score: ${ipqsScore}`, id);
    const err = new Error('5.7.1 IP reported as malicious by IPQS');
    err.responseCode = 554;
    throw err;
  }

  if(ipscore instanceof Error){
    Log.info(ipscore.message,id)
    ipscore.responseCode = 554;
    throw ipscore;
  }

  return true;
}

/**
 * Handles the close of an SMTP session.
 *
 * @param {Object} session - The session object for the SMTP transaction.
 * @returns {void}
 */
export function handleClose(session) {
  Log.info(`${session.remoteAddress} disconnected.`, session.id);
}

/**
 * Handles secure connection upgrade (STARTTLS) during SMTP transaction.
 *
 * @param {Object} socket - The socket object of the connection.
 * @param {Object} session - The session object for the SMTP transaction.
 * @param {Function} callback - The callback to signal the completion of the upgrade.
 * @returns Function - Returns callback
 */
export function handleSecure(socket, session, callback) {
  const protocol = socket.getProtocol();
  const cipherName = socket.getCipher().name;
  Log.info(`Connection upgraded to ${protocol} (${cipherName})`, session.id);
  return callback();
}