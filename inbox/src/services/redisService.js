import redis from 'redis';
import { Logger } from '@carlgo11/smtp-server';

class Redis {
  constructor() {
    try {
      this.client = redis.createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      });

      this.client.connect().then(() => Logger.debug('Connected to Redis server.'));
    } catch (e) {
      Logger.error(`Redis error: ${e}`);
      throw e;
    }
  }

  async get(key) {
    return this.client.get(key).then(reply => reply ? reply:null);
  }

  async set(key, value, ttl = null) {
    const args = [key, JSON.stringify(value)];
    if (ttl)
      args.push('EX', ttl); // Set expiration if TTL is provided
    return this.client.set(...args).catch((e) => {
      Logger.error('Redis _set error:', e);
      throw e;
    });
  }
}

export default new Redis();
