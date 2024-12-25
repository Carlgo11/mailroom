import Email from '../models/email.js';
import redis from '../services/redis.js';
import { Response } from '@carlgo11/smtp-server';

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
  if(!authorizedSender(session.username, email.headers.from))
    throw new Response(`${session.username} not allowed to send emails as ${email.headers.from}`, 550, [5, 7, 1]);

  // Set RFC 5322 compliant date
  const date = convertDate(email.headers.date || email.date);
  email.headers.date = date;
  email.date = date;

  console.log(email.full_email());
}

function authorizedSender(user, from){
  return user === from || redis.get(`alias:${from}`) === user;
}

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
