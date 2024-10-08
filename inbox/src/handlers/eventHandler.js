import {handleIncomingEmail} from '../controllers/emailController.js';
import {userExists} from '../services/userService.js';
import Log from '../services/logService.js';
import Spamhaus from '../validators/spamhaus.js';
import ipScore from '../validators/ipScore.js';
import ipQS from '../validators/ipQS.js';
import {Response} from '@carlgo11/smtp-server';

/**
 * Handles the RCPT TO command during SMTP transaction.
 *
 * @param {Object} address - The address object containing recipient's email.
 * @param {Object} session - The session object for the SMTP transaction.
 * @returns Function - Returns callback
 */
export async function handleRcptTo(address, {id}) {
  const recipientExists = await userExists(address);
  if (!recipientExists) {
    Log.info(`Unknown recipient <${address}>`, id);
    throw new Response(`Mailbox <${address}> not found`, 550, [5, 1, 1]);
  }
  return true;
}

/**
 * Handles the DATA command during SMTP transaction.
 *
 * @param {Object} stream - The stream object containing the email content.
 * @param {Object} session - The session object for the SMTP transaction.
 * @returns Function - Returns callback
 */
export async function handleData(stream, session) {
  try {
    Log.info('Client sending message', session.id);
    await handleIncomingEmail(stream, session);
    Log.info('Message accepted', session.id);
    return true;
  } catch (err) {
    Log.error(`Message rejected: ${err.message}`, session.id);
    throw err;
  }
}

/**
 * Validates the IP address of the connecting client against blacklists and fraud score services.
 *
 * @param {string} clientIP - The IP address of the connecting client.
 * @param {string} id - The session ID for logging.
 * @param rDNS
 * @returns {Promise<Awaited<void>[]>} Returns the validation promise of void.
 * @throws {Error} Throws an error if the IP address is blacklisted or has a high fraud score.
 */
export async function handleConnect({clientIP, id, rDNS}) {
  Log.info(`${clientIP} connected>. <${rDNS}>`, id);
  const ipqsScoreLimit = parseInt(process.env.IPQS_SCORE_LIMIT, 10) || 90;

  return Promise.all([
    Spamhaus.lookupIP(clientIP).then((listed) => {
      if (listed) {
        Log.info(`${clientIP} blacklisted by Spamhaus`, id);
        throw new Response('IP blacklisted by Spamhaus', 554, [5, 7, 1]);
      }
    }),

    ipQS.lookupIP(clientIP).then((score) => {
      if (score > ipqsScoreLimit) {
        Log.info(`${clientIP} has high IPQS score: ${score}`, id);
        throw new Response('IP reported as malicious by IPQS', 554, [5, 7, 1]);
      }
    }),

    ipScore.lookupIP(clientIP).then((list) => {
      if (list !== null) {
        Log.info(`${clientIP} blacklisted by ${list}`, id);
        throw new Response(`IP blacklisted by ${list}`, 554, [5, 7, 1]);
      }
    }),
  ]);
}

/**
 * Handles the close of an SMTP session.
 *
 * @param {Object} session - The session object for the SMTP transaction.
 * @returns {void}
 */
export function handleClose(session) {
  if (session.remoteAddress)
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