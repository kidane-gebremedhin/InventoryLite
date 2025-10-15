'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RecordStatus, RedisCacheKey } from '../Enums';
import { Store, RecordStatusPayload, ServerActionsResponse } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';
import { getCacheData, setCacheData } from './redis';

interface SearchParams {
    selectedStatus: string,
    searchTerm: string,
    startIndex: number,
    endIndex: number
}

export async function fetchStores({selectedStatus, searchTerm, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const cacheKey = `${RedisCacheKey.stores}_${selectedStatus}_${searchTerm}_${startIndex}_${endIndex}`;
    const cachedData = await getCacheData(cacheKey);
    if (!cachedData) {
        let query = supabase.from(DATABASE_TABLE.stores).select('*', {count: 'exact', head: false})
        if (selectedStatus !== ALL_OPTIONS) {
            query = query.eq('status', selectedStatus)
        }
        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%`)
        }
        
        const { data, count, error } = await query.order('created_at', { ascending: false })
            .range(startIndex, endIndex)

        // Return from DB and update the cache asyncronously
        setCacheData(cacheKey, { data, count, error });
        return { data, count, error };
    }

    return cachedData;
}

export async function fetchStoreOptions(): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const cachedData = await getCacheData(RedisCacheKey.stores);
    if (!cachedData) {
        const { data, count, error } = await supabase.from(DATABASE_TABLE.stores)
            .select('id, name', {count: 'exact', head: false})
            .eq('status', RecordStatus.ACTIVE)
            .order('name', { ascending: true });
        
        // Return from DB and update the cache asyncronously
        setCacheData(RedisCacheKey.stores, { data, count, error });
        return { data, count, error }
    }

    return cachedData;
}

export async function saveStore(requestData: Store): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.stores)
        .insert(requestData)
        .select();
    
    return { data, error };
}

export async function updateStore(id: string, requestData: Store): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.stores)
        .update(requestData)
        .eq('id', id)
        .select();
    
    return { data, error };
}

export async function updateStoreRecordStatus(id: string, requestData: RecordStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.stores)
        .update(requestData)
        .eq('id', id)
        .select();
    
    return { data, error };
}
