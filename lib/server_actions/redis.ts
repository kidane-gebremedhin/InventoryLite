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
