const redis = require('redis');

// Create a Redis client
const client = redis.createClient({
  url: `redis://redis_mail:6379`,
});

client.on('error', (e) => console.error('Redis client error:', e));

client.connect().
    then(() => console.log('Connected to Redis')).
    catch((e) => console.error('Failed to connect to Redis:', e));

class UserService {
  // Check if a user exists
  async userExists(user) {
    try {
      // Check if the user exists directly
      const userExists = await this._exists(`user:${user}`);
      if (userExists) return user;  // User exists as is

      // If the user doesn't exist, check for an alias
      const aliasExists = await this._exists(`alias:${user}`);
      if (aliasExists) return await this._get(`alias:${user}`);  // Return the aliased delivery email address

      // Neither user nor alias exists
      return null;
    } catch (error) {
      console.error('Error checking user existence:', error);
      throw error;
    }
  }

  // Private method to check if a key exists in Redis
  _exists(key) {
    return client.exists(key).then((reply) => reply === 1).catch((e) => {
      console.error('Redis _exists check error:', e);
      throw e;
    });
  }

  // Private method to get a value from Redis
  _get(key) {
    return client.get(key).then((reply) => reply).catch((e) => {
      console.error('Redis _get error:', e);
      throw e;
    });
  }
}

module.exports = new UserService();