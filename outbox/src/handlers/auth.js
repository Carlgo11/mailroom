import { Response } from '@carlgo11/smtp-server';
import redis from '../services/redis.js';
import bcrypt from 'bcrypt';

export async function handleAuth(args, session) {
  const method = args[0].toUpperCase();
  console.log(method);
  switch (method) {
    case 'PLAIN':
      return plain(args, session);
    default:
      return session.send(
        new Response('Unrecognized authentication type', 504, [5, 7, 4]));
  }
}

async function plain(args, session) {
  if (args.length > 2)
    return session.send(
      new Response('Invalid parameter length', 500, [5, 5, 6]));

  try {
    const [authz, username, password] = atob(args[1]).split('\0');
    console.log(username, password);

    const auth = await authenticate(username, password);
    if (!auth) throw null;
    session.username = username;

  } catch (e) {
    return session.send(new Response('Authentication failed', 535, [5, 7, 8]));
  }
}

async function authenticate(username, password) {
  try {
    const data = await redis.get(`user:${username}`);
    const json = JSON.parse(data);
    return bcrypt.compare(password, json.password);

  }catch (e) {
    throw new Response('Authentication failed', 535);
  }
}
