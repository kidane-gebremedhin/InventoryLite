'use server';

import { REDIS_CACHE_TTL_USER_SUBSCRIPTION_INFO } from "../Constants";
import { RedisCacheKey, RPC_FUNCTION } from "../Enums";
import { UserSubscriptionInfo, User } from "../types/Models";
import { makeRpcCall } from "./rpc";
import { User as SupabaseUser } from "@supabase/supabase-js"

export const fetchUserProfile = async (user: SupabaseUser, useCache: boolean = false): Promise<User> => {
  if (!user) return null;

  const userData: User = {
    id: user.id,
    fullName: user.user_metadata.full_name,
    email: user.email!,
    picturePicture: user.user_metadata.picture,
    subscriptionInfo: await fetchUserSubscriptionInfo(user, useCache)
  };

  return userData;
}

export const fetchUserSubscriptionInfo = async (user: SupabaseUser, useCache: boolean): Promise<UserSubscriptionInfo> => {
    if (useCache) {
      // Import here since it is not supported in middleware
      const {redisClient} = await import('@/lib/redis-client');

      const cacheKey = `${RedisCacheKey.user_subscription_info}_${user.id}`;
      const cachedData = await redisClient.get(cacheKey);
      if (!cachedData) {
          console.log('fetchUserSubscriptionInfo From DB')
          // RPC call to fetch subscription info
          const searchParams = { current_user_id: user.id }
          const { data, error } = await makeRpcCall(RPC_FUNCTION.FETCH_USER_SUBSCRIPTION_INFO, searchParams)
          if (error) {
              return null;
          }
          const userSubscriptionInfo = data.length > 0 ? data[0] : null
          redisClient.set(cacheKey, JSON.stringify(userSubscriptionInfo), 'EX', REDIS_CACHE_TTL_USER_SUBSCRIPTION_INFO)
          return userSubscriptionInfo;
      }

      console.log('fetchUserSubscriptionInfo From Redis Cache')
      return JSON.parse(cachedData);
    }
    
    // When the call is from middleware
    // RPC call to fetch subscription info
    const searchParams = { current_user_id: user.id }
    const { data, error } = await makeRpcCall(RPC_FUNCTION.FETCH_USER_SUBSCRIPTION_INFO, searchParams)
    if (error) {
        return null;
    }
    return data.length > 0 ? data[0] : null;
}
