import Redis from './redisService.js';

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
      Redis.get(`user:${username}`),
      Redis.get(`alias:${username}`),
    ]);

    return user ? username : alias || false;

  } catch (e) {
    console.error('Error checking user existence:', e);
    throw e;
  }
}

