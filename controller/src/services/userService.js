import {createClient} from 'redis';
import bcrypt from 'bcrypt';
import {get} from 'node:http';

// Create a Redis client
const client = await createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
}).on('error', (e) => console.error('Redis client error:', e)).connect();

export async function register(address, password) {
  if (await _get(`user:${address}`))
    return new Error('User already exists');

  const hash = bcrypt.hash(password, 13);
  const [username, domain] = address.split('@');
  const user = {
    password: `{BLF-CRYPT}${await hash}`,
    maildir: `maildir:/var/mail/vhosts/${domain}/${username}/Maildir`,
    home: `/var/mail/vhosts/${domain}/${username}/`,
  }
  return await _set(`user:${address}`, JSON.stringify(user));
}

export async function listUsers(){
  const users = await _list('user:*');
  const userArray = []
  users.map((user) => {userArray.push(user.replace('user:',''))})
  return userArray
}

export async function getUser(address) {
  const user = await JSON.parse(await _get(`user:${address}`));
  if(!user) return null;
  console.log(user);
  return {
    maildir: user.maildir,
    home: user.home
  }
}

// Private method to get a value from Redis
async function _get(key) {
  return client.get(key).then((reply) => reply).catch((e) => {
    console.error('Redis _get error:', e);
    throw e;
  });
}

async function _list(key) {
  return client.keys(key).then((reply) => reply).catch((e) => {
    console.error('Redis _list error:', e);
    throw e;
  });
}

async function _set(key, value) {
  return await client.set(key, value).catch((e) => {
    console.error('Redis _set error:', e);
    throw e;
  });
}