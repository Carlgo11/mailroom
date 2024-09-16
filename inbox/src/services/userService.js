import redis from 'redis';

// Create a Redis client
const client = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

client.on('error', (e) => console.error('Redis client error:', e));

client.connect().
    then(() => console.log('Connected to Redis')).
    catch((e) => console.error('Failed to connect to Redis:', e));

/**
 * Check if a mail account exists
 *
 * @param username Username to check for
 * @returns {Promise<string|boolean>} Returns username if the address exists or is an alias. Returns false if no user or alias by that name exists.
 */
export async function userExists(username) {
  try {
    // Run both user and alias checks concurrently
    const [user, alias] = await Promise.all([
      _get(`user:${username}`),
      _get(`alias:${username}`),
    ]);

    return user ? username : alias || false;

  } catch (e) {
    console.error('Error checking user existence:', e);
    throw e;
  }
}

// Private method to get a value from Redis
async function _get(key) {
  return client.get(key).then((reply) => reply).catch((e) => {
    console.error('Redis _get error:', e);
    throw e;
  });
}
