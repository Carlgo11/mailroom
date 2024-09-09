const redis = require('redis');
const bcrypt = require('bcrypt');

// Create a Redis client
const client = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

client.on('error', (e) => console.error('Redis client error:', e));
client.connect().
    then(() => console.log('Connected to Redis')).
    catch((e) => console.error('Failed to connect to Redis:', e));

class AuthService {
  async authenticate(username, password) {
    const user = await this._get(`user:${username}`);
    const data = JSON.parse(user);
    const hash = data.password.replace('{BLF-CRYPT}', '');
    return bcrypt.compare(password, hash)
  }

  // Private method to get a value from Redis
  _get(key) {
    return client.get(key).then((reply) => reply).catch((e) => {
      console.error('Redis _get error:', e);
      throw e;
    });
  }
}

module.exports = new AuthService();