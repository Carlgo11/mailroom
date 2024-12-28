import { Response } from '@carlgo11/smtp-server';
import redis from '../services/redis.js';
import bcrypt from 'bcrypt';

/**
 * Handles the authentication process for the session based on the provided arguments.
 * Validates the session's state and TLS configuration before proceeding with authentication.
 *
 * @param {Array<string>} args - The authentication arguments passed by the client, such as the method type.
 * @param {Object} session - The session object, which contains information about the current connection and its state.
 * @return {Promise<Object>} A promise that resolves to a Response object indicating the result of the authentication process.
 */
export default async function handleAuth(args, session) {
  if (!session.tls)
    return session.send(new Response('STARTTLS required', 523, [5, 7, 10]));

  if (session.state !== session.states.STARTTLS)
    return session.send(new Response(null, 503, [5, 5, 1]));

  const authMethod = args[0].toUpperCase();
  switch (authMethod) {
    case 'PLAIN':
      return plain(args, session);
    default:
      return session.send(
        new Response('Unrecognized authentication type', 504, [5, 7, 4]));
  }
}

/**
 * Handles PLAIN authentication.
 *
 * @param {string[]} args - Array of arguments where the second item should be a Base64-encoded string containing `authzId`, `username`, and `password` separated by null characters.
 * @param {object} session - The current session object where the authenticated `username` will be stored.
 * @return {Promise<boolean>} A response indicating the result of the authentication process. Returns success or error responses based on the operation outcome.
 */
async function plain(args, session) {
  try {
    if (args.length > 2)
      throw new Response('Too many parameters', 501, [5, 5, 2]);

    const {username, password} = decodeCredentials(args[1]);

    if (!await authenticate(username, password))
      throw new Response('Authentication credentials invalid', 535, [5, 7, 8]);

    session.username = username;
    session.send(new Response('Authentication Succeeded', 235, [2, 7, 0]));
    return true;

  } catch (e) {
    session.send(e instanceof Response ?
      e:
      new Response('Temporary authentication failure', 454, [4, 7, 0]));
    return false;
  }
}

/**
 * Decodes a base64-encoded credentials string into its individual components.
 *
 * @param {string} credentials - The base64-encoded credentials string to decode.
 * @return {Object} An object containing the decoded `authzId`, `username`, and `password` fields.
 * @throws {Response} Throws a Response error if the `authzId` or `username` is invalid, or if there is a parameter length issue.
 */
function decodeCredentials(credentials) {
  try {
    if (credentials.length > 12288)
      throw new Response('Authentication Exchange line is too long', 500, [5, 5, 6]);

    const string = Buffer.from(credentials, 'base64').toString();
    const [authzId, username, password] = string.split('\0');

    if (!authzId.match(/^([a-zA-Z0-9._%+-]+)?$/) || authzId.length > 255)
      throw new Response('Invalid authorization identity', 501, [5, 5, 2]);

    if (!username.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) || username.length > 255)
      throw new Response('Invalid username', 501, [5, 5, 2]);

    return { authzId, username, password };
  } catch (e) {
    throw e instanceof TypeError ?
      new Response('Invalid Base64 encoding', 501, [5, 5, 2]):
      e;
  }
}

/**
 * Authenticates a user by comparing the provided password with the stored hash in the Redis database.
 *
 * @param {string} username - The username of the user attempting to authenticate.
 * @param {string} password - The plaintext password provided for authentication.
 * @return {Promise<boolean>} Returns a promise that resolves to true if authentication is successful, otherwise false.
 * @throws {boolean} Throws false if an error occurs during the authentication process.
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
