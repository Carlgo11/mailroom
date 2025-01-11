import Email from '../models/email.js';
import redis from '../services/redis.js';
import { Response } from '@carlgo11/smtp-server';
import signMessage from '../services/dkim.js';
import fs from 'fs/promises';
import {exec} from 'child_process';

export default async function handleData(message, session) {
  const from = session.mailFrom;
  const domain = from.split('@')[from.split('@').length - 1];
  const id = `${session.id}@${domain}`;
  const email = new Email({ id, from });
  await Promise.all([
    email.parseMessage(message),
    email.parseSession(session),
  ]);

  // Verify user can send from that address
  if (!await authorizedSender(session.username,
    email.headers.from.split('<')[1].split('>')[0].toLowerCase()))
    throw new Response(
      `${session.username} not allowed to send emails as ${email.headers.from}`,
      550, [5, 7, 1]);

  // Set RFC 5322 compliant date
  const date = convertDate(email.headers.date || email.date);
  email.headers.date = date;
  email.date = date;

  try {
    const dkimKey = await fs.readFile(`${process.env.DKIM_PATH}/${domain}.key`);

    // DKIM sign message
    if (dkimKey) {
      const headers = [
        'from',
        'to',
        'subject',
        'date',
        'message-id',
        'mime-version',
        'content-type',
        'content-transfer-encoding',
      ];

      const dkimSignature = signMessage(
        email.serializeHeaders().split('\r\n'), email.body, domain, 'dkim', dkimKey, headers,
      );
      if (dkimSignature) email.headers['dkim-signature'] = dkimSignature;
    }
  } catch (e) {
    console.error(e);
  }

  await fs.writeFile(`/tmp/${email.id}.eml`, email.full_email());

  exec(`cat /tmp/${email.id}.eml | sendmail -t -v -f ${from}`, (error, stdout, stderr) => {
    if (error) {
      throw error;
    }
  });
}

/**
 * Verifies if the given sender is authorized based on the user identity or an alias stored in a Redis database.
 *
 * @param {string} user - The identifier of the user to verify.
 * @param {string} from - The sender identity to check against the user or alias.
 * @return {Promise<boolean>} A promise resolving to `true` if the sender is authorized, otherwise `false`.
 */
async function authorizedSender(user, from) {
  return user === from || await redis.get(`alias:${from}`) === user;
}

/**
 * Converts a given date string into an RFC 5322 compliant format.
 *
 * @param {string} dateHeaderValue - The date string to be converted.
 * @return {string} The formatted date string in RFC 5322 format.
 * @throws {Error} If the provided date string is invalid.
 */
function convertDate(dateHeaderValue) {
  // Parse the date using the built-in Date object
  const parsedDate = new Date(dateHeaderValue);

  // Check if the date is valid
  if (isNaN(parsedDate.getTime())) {
    throw new Error('Invalid Date header');
  }

  // Format the date in RFC 5322 compliant format
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'];

  const day = days[parsedDate.getUTCDay()];
  const date = String(parsedDate.getUTCDate());
  const month = months[parsedDate.getUTCMonth()];
  const year = parsedDate.getUTCFullYear();
  const hours = String(parsedDate.getUTCHours()).padStart(2, '0');
  const minutes = String(parsedDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(parsedDate.getUTCSeconds()).padStart(2, '0');

  // Construct the RFC 5322 compliant date string
  return `${day}, ${date} ${month} ${year} ${hours}:${minutes}:${seconds} +0000`;
}
