import { Redis } from 'ioredis';

declare global {
  var redis: Redis | undefined;
}

/**
 * Initializes and returns a singleton instance of the ioredis client.
 */
const redisClient = (() => {
  const REDIS_URL = process.env.REDIS_URL;

  if (!REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set.');
  }
  
  const redis = new Redis(REDIS_URL);
  
  if (process.env.NODE_ENV === 'production') {
    // In production, initialize the client normally
    return redis;
  } else {
    // In development (when hot-reloading occurs), use the global object
    // to preserve the client instance and state across reloads.
    if (!global.redis) {
      global.redis = redis;
    }
    return global.redis;
  }
})();

export { redisClient };
