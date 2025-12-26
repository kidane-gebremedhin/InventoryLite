"use server";

import { Redis } from "@upstash/redis";
import { REDIS_CACHE_TTL } from "../Constants";
import type { ServerActionsResponse } from "../types/Models";

const redisClient = Redis.fromEnv();

export const getCacheData = async (
	cacheKey: string,
): Promise<ServerActionsResponse> => {
	const cachedData = await redisClient.get<ServerActionsResponse>(cacheKey);
	if (!cachedData) return null;

	return cachedData;
};

export const setCacheData = async (cacheKey: string, data: object) => {
	redisClient.set(cacheKey, JSON.stringify(data), { ex: REDIS_CACHE_TTL });
};

/**
 * Deletes all Redis keys starting with a specific prefix.
 */
export async function deleteCacheByKeyPrefix(prefix: string) {
	let cursor = "0";
	do {
		const reply = await redisClient.scan(cursor, {
			match: `${prefix}*`,
			count: 100,
		});

		cursor = reply[0];
		const keys = reply[1];
		if (keys.length > 0) {
			await redisClient.unlink(...keys);
		}
	} while (cursor !== "0");

	console.log(`Deleted all keys with prefix: ${prefix}*`);
}
