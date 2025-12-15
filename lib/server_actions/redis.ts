'use server';

import { redisClient } from "../../lib/redis-client";
import { REDIS_CACHE_TTL } from "../Constants";
import { ServerActionsResponse } from "../types/Models";

export const getCacheData = async (cacheKey): Promise<ServerActionsResponse> => {
    const cachedData = await redisClient.get(cacheKey);
    if (!cachedData) return null;
    
    return JSON.parse(cachedData);
}

export const setCacheData = async (cacheKey, data) => {
  redisClient.set(cacheKey, JSON.stringify(data), 'EX', REDIS_CACHE_TTL)
}

/**
 * Deletes all Redis keys starting with a specific prefix.
 */
export async function deleteCacheKeyByKeyPrefix(prefix: string) {
  const stream = redis.scanStream({
    match: `${prefix}*`,
    count: 1000,
  });

  const pipeline = redis.pipeline();

  for await (const keys of stream) {
    if (keys.length) {
      keys.forEach((key) => pipeline.del(key));
    }
  }

  await pipeline.exec();
}
