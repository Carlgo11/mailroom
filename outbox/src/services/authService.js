import redis from 'redis';
import bcrypt from 'bcrypt';
import log from './logService.js';

export class AuthService {
  constructor() {
    this.client = redis.createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });

    this.client.on('error', (e) => log.error(`Redis client error: ${e}`));
    this.client.connect().
        then(() => log.debug('Connected to Redis')).
        catch((e) => log.error(`Failed to connect to Redis: ${e}`));
  }

  async authenticate(username, password) {
    const user = await this._get(`user:${username}`);
    const data = JSON.parse(user);
    const hash = data.password.replace('{BLF-CRYPT}', '');
    return bcrypt.compare(password, hash);
  }

  // Private method to get a value from Redis
  async _get(key) {
    return this.client.get(key).then((reply) => reply).catch((e) => {
      log.error('Redis _get error:', e);
      throw e;
    });
  }
}

module.exports = new AuthService();