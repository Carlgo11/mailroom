import redis from 'redis';
import {Log} from '@carlgo11/smtp-server';

class Redis {
  constructor() {
    try {
      this.client = redis.createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      });

      this.client.connect().
          then(() => Log.debug(`Connected to Redis server.`));
    } catch (e) {
      Log.error(`Redis error: ${e}`);
      throw e;
    }
  }

  async get(key) {
    return this.client.get(key).then((reply) => reply).catch((e) => {
      console.error('Redis _get error:', e);
      throw e;
    });
  }

  async set(key, value, ttl = null) {
    return this.client.set(key, JSON.stringify(value), 'EX', ttl);
  }
}

export default new Redis();