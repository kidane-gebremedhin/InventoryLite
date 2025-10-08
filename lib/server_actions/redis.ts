'use server'; // MANDATORY directive for Server Actions

import { redisClient } from "../../lib/redis-client";

/**
 * Server Action to handle the Redis interaction. This function runs only on the server.
 * @param formData - The form data object from the submitted form.
 */
export async function cacheData(formData: FormData) {
  const key = formData.get('key') as string;
  const value = formData.get('value') as string;

  if (!key || !value) {
    return { success: false, message: 'Key and Value are required.' };
  }

  const cachedValue = await redisClient.get(key);
  if (cachedValue) {
    return {
      success: true,
      message: `Returing from cache: "${cachedValue}"`
    };
  }

  try {
    // EX 60 means the key will expire in 60 seconds (a common caching pattern)
    await redisClient.set(key, value, 'EX', 60);
    const savedValue = await redisClient.get(key);

    return {
      success: true,
      message: `Successfully cached key "${key}". Retrieved confirmation: "${savedValue}"`,
    };
  } catch (error) {
    console.error('Redis operation failed:', error);
    return {
      success: false,
      message: 'Failed to connect to Redis or execute command. Check server logs.',
    };
  }
}
