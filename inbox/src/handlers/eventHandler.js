import { handleIncomingEmail } from '../controllers/emailController.js';
import { userExists } from '../services/userService.js';
import { Logger, Response } from '@carlgo11/smtp-server';
import Spamhaus from '../validators/spamhaus.js';
import ipScore from '../validators/ipScore.js';
import ipQS from '../validators/ipQS.js';
import { isIPv4, isIPv6 } from 'net';
import Redis from '../services/redisService.js';

/**
 * Handles the RCPT TO command during SMTP transaction.
 *
 * @param {String} address - The address of the recipient's email.
 * @param {Object} session - The session object for the SMTP transaction.
 * @returns Function - Returns callback
 */
export async function handleRcptTo(address, { id }) {
  const recipientExists = await userExists(address);
  if (!recipientExists) {
    Logger.info(`Unknown recipient <${address}>`, id);
    throw new Response(`Mailbox <${address}> not found`, 550, [5, 1, 1]);
  }
  return true;
}

/**
 * Handles the MAIL FROM command during SMTP transaction.
 *
 * @param {String} address - The sender's email address.
 * @param {Object} session - The session object for the SMTP transaction.
 * @param {Array} extensions - ESMTP extensions declared as arguments.
 * @returns {Promise<void>}
 */
export async function handleMailFrom(address, session, extensions) {
  if (!address.match(
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
    throw new Response('Bad destination mailbox address syntax', 501,
      [5, 1, 3]);

  if (extensions.includes('BODY=8BITMIME'))
    session.utf8 = true;
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
    Logger.info('Client sending message', session.id);
    await handleIncomingEmail(stream, session);
    Logger.info('Message accepted', session.id);
    return true;
  } catch (err) {
    Logger.error(`Message rejected: ${err.message}`, session.id);
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
export async function handleConnect({ clientIP, id, rDNS }) {
  const ipqsScoreLimit = parseInt(process.env.IPQS_SCORE_LIMIT, 10) || 90;

  // Check if the result is cached first
  const cacheKey = `ip-lookup:${clientIP}`;
  const cachedResult = await Redis.get(cacheKey);

  // If cached, return the cached response
  if (cachedResult !== null)
    if (cachedResult === "true") return cachedResult;
    else throw new Response(cachedResult, 554, [5, 7, 1]);

  // Perform checks if not cached
  return Promise.all([
    Spamhaus.lookupIP(clientIP).then((listed) => {
      if (listed) {
        const errorMessage = 'IP blacklisted by Spamhaus';
        Logger.warn(`${clientIP} blacklisted by Spamhaus`, id);
        // Cache the error message and throw the response
        throw new Response(errorMessage, 554, [5, 7, 1]);
      }
    }),

    ipQS.lookupIP(clientIP).then((score) => {
      if (score > ipqsScoreLimit) {
        const errorMessage = `IP reported as malicious by ipqualityscore.com`;
        Logger.warn(`${clientIP} has high IPQS score: ${score}`, id);
        // Cache the error message and throw the response
        throw new Response(errorMessage, 554, [5, 7, 1]);
      }
    }),

    ipScore.lookupIP(clientIP).then((list) => {
      if (list === null) {
        const errorMessage = `IP blacklisted by ${list}`;
        Logger.warn(`${clientIP} blacklisted by ${list}`, id);
        // Cache the error message and throw the response
        throw new Response(errorMessage, 554, [5, 7, 1]);
      }
    }),

    () => {
      if (process.env.INBOX_AUTH.includes('rdns') && rDNS !== null)
        throw new Response(`Reverse DNS validation failed`, 554, [5, 7, 25]);
    },
  ]).then(() => {
    // If no errors were thrown, cache the success result
    Redis.set(cacheKey, true, 3600);  // Cache "true" for 1 hour if the IP is safe
    return true;  // IP is safe
  }).catch((e) => {
    if (e instanceof Response)
      Redis.set(cacheKey, e.message, 3600);

    throw e;
  });
}

export async function handleEhlo(domain, session) {
  if (process.env.INBOX_AUTH.includes('rdns') && domain !== session.rDNS)
    throw new Response(`Reverse DNS validation failed`, 550, [5, 7, 25]);

  if (domain === process.env.INBOX_HOST)
    session.socket.end();

  if (isIPv4(domain) || isIPv6(domain) ||
    (domain.startsWith('[') && domain.endsWith(']')))
    throw new Response('IP literals not supported at this time', 501,
      [5, 5, 4]);
}
