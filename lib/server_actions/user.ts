'use server';

import { CACHE_TTL_USER_SUBSCRIPTION_INFO } from "../Constants";
import { CookiesKey, DATABASE_TABLE, RedisCacheKey, RPC_FUNCTION } from "../Enums";
import { UserSubscriptionInfo, User, StatusPayload, ServerActionsResponse } from "../types/Models";
import { makeRpcCall } from "./rpc";
import { User as SupabaseUser } from "@supabase/supabase-js"
import { cookies } from "next/headers";
import { createClient } from '@/supabase/server';
import { createServerClientWithServiceKey } from '@/supabase/server'

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
          // RPC call to fetch subscription info
          const searchParams = { current_user_id: user.id }
          const { data, error } = await makeRpcCall(RPC_FUNCTION.FETCH_USER_SUBSCRIPTION_INFO, searchParams)
          if (error) {
              return null;
          }
          const userSubscriptionInfo = data.length > 0 ? data[0] : null
          redisClient.set(cacheKey, JSON.stringify(userSubscriptionInfo), 'EX', CACHE_TTL_USER_SUBSCRIPTION_INFO)
          return userSubscriptionInfo;
      }

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

export async function updateUserSubscriptionInfo(email: string, requestData: Partial<UserSubscriptionInfo>): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.tenants)
        .update(requestData)
        .eq('email', email)
        .select();

    return { data, error };
}

export async function updateTenantRecordStatus(id: string, requestData: StatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.tenants)
        .update(requestData)
        .eq('id', id)
        .select();
    
    return { data, error };
}

export const clearUserCache = async (user: User) => {
  const {redisClient} = await import('@/lib/redis-client');
  const cacheKey = `${RedisCacheKey.user_subscription_info}_${user.id}`;
  redisClient.flushall()
  console.log(`Cleared cache with key ${cacheKey}`)
}

export const clearUserCookies = async () => {
  const cookieStore = await cookies();

  // 1. Delete cookies by key. 
  cookieStore.getAll().forEach((cookie) => {
    cookieStore.set(cookie.name, "", {
      expires: new Date(0),
      path: "/",
    });

    console.log(`Cleared Cookies with key ${cookie.name}`)
  });
}

export const clearUserSubscriptionInfo = async (user: User) => {
  const {redisClient} = await import('@/lib/redis-client');
  const cacheKey = `${RedisCacheKey.user_subscription_info}_${user.id}`;
  redisClient.del(cacheKey)
  console.log(`Cleared cache with key ${cacheKey}`)
}

export const clearSubscriptionInfoCookies = async () => {
  const cookieStore = await cookies();

  // 1. Delete cookies by key. 
  cookieStore.delete(CookiesKey.ucookiesinfo);
  console.log(`Cleared Cookies with key ${CookiesKey.ucookiesinfo}`)
}

export const deleteUserAccount = async (userId) => {
  const supabase = createServerClientWithServiceKey();
  // RPC call
  // const { data, error } = await supabase
  //   .rpc(RPC_FUNCTION.DELETE_USER_ACCOUNT);
  const { data, error } = await supabase.auth.admin.deleteUser(userId);
  // const { data, error } = await supabase.rpc('delete_user_account');
  console.log("deletion status")
  console.log(data)
  console.log(error)
  return { data, error };
}