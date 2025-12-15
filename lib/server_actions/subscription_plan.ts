'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RecordStatus, RedisCacheKey } from '../Enums';
import { SubscriptionPlan, StatusPayload, ServerActionsResponse } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';
import { deleteCacheKeyByKeyPrefix, getCacheData, setCacheData } from './redis';

interface SearchParams {
    selectedSubscriptionStatus: string,
    selectedCurrencyType: string,
    selectedStatus: string,
    startIndex: number,
    endIndex: number
}

export async function fetchSubscriptionPlans({selectedSubscriptionStatus, selectedCurrencyType, selectedStatus, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const cacheKey = `${RedisCacheKey.subscription_plans}_${selectedSubscriptionStatus}_${selectedCurrencyType}_${selectedStatus}_${startIndex}_${endIndex}`;
    const cachedData = await getCacheData(cacheKey);
    if (!cachedData) {
        let query = supabase.from(DATABASE_TABLE.subscription_plans).select('*', {count: 'exact', head: false})
        if (selectedSubscriptionStatus !== ALL_OPTIONS) {
            query = query.eq('subscription_status', selectedSubscriptionStatus)
        }
        if (selectedCurrencyType !== ALL_OPTIONS) {
            query = query.eq('currency_type', selectedCurrencyType)
        }
        if (selectedStatus !== ALL_OPTIONS) {
            query = query.eq('status', selectedStatus)
        }
        const { data, count, error } = await query.order('created_at', { ascending: false })
        .range(startIndex, endIndex)

        // Return from DB and update the cache asyncronously
        setCacheData(cacheKey, { data, count, error });
        return { data, count, error };
    }

    return cachedData;
}

export async function fetchSubscriptionPlanOptions(): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const cachedData = await getCacheData(RedisCacheKey.subscription_plans);
    if (!cachedData) {
        const { data, count, error } = await supabase.from(DATABASE_TABLE.subscription_plans)
            .select('id, name', {count: 'exact', head: false})
            .eq('status', RecordStatus.ACTIVE)
            .order('name', { ascending: true })
        
        // Return from DB and update the cache asyncronously
        setCacheData(RedisCacheKey.subscription_plans, { data, count, error });
        return { data, count, error }
    }

    return cachedData;
}

export async function saveSubscriptionPlan(requestData: SubscriptionPlan): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.subscription_plans)
        .insert(requestData)
        .select();
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.subscription_plans);
    return { data, error };
}

export async function updateSubscriptionPlan(id: string, requestData: SubscriptionPlan): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.subscription_plans)
        .update(requestData)
        .eq('id', id)
        .select();
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.subscription_plans);
    return { data, error };
}

export async function updateSubscriptionPlanRecordStatus(id: string, requestData: StatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.subscription_plans)
        .update(requestData)
        .eq('id', id)
        .select();
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.subscription_plans);
    return { data, error };
}
