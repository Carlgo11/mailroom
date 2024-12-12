import { Response } from '@carlgo11/smtp-server';
import redis from '../services/redis.js';
import bcrypt from 'bcrypt';

export async function handleAuth(args, session) {
  if (!session.tls)
    return session.send(new Response('STARTTLS required', 523, [5, 7, 10]));

  if (session.state !== session.states.STARTTLS)
    return session.send(new Response(null, 503, [5, 5, 1]));

  const method = args[0].toUpperCase();
  switch (method) {
    case 'PLAIN':
      return plain(args, session);
    default:
      return session.send(
        new Response('Unrecognized authentication type', 504, [5, 7, 4]));
  }
}

/**
 * handle PLAIN authentication.
 *
 * @param args
 * @param session
 * @returns {Promise<*>}
 */
async function plain(args, session) {
  if (args.length > 2)
    return session.send(
      new Response('Invalid parameter length', 500, [5, 5, 6]));

  try {
    const [authzId, username, password] = atob(args[1]).split('\0');
    const auth = await authenticate(username, password);
    // Failed auth
    if (!auth) throw false;

    // Successful auth
    session.username = username;
    return session.send(
      new Response('Authentication successful', 235, [2, 7, 0]));

  } catch (e) {
    return session.send(new Response('Authentication failed', 535, [5, 7, 8]));
  }
}

/**
 * Authenticate client with provided credentials.
 *
 * @param {string} username
 * @param {string} password
 */
async function authenticate(username, password) {
  try {
    const data = await redis.get(`user:${username}`);
    const json = JSON.parse(data);
    return bcrypt.compare(password, json.password.replace('{BLF-CRYPT}', ''));
  } catch (_) {
    throw false;
  }
}
