'use server';

import { ALL_OPTIONS } from '../Constants';
import { DATABASE_TABLE, RecordStatus, RedisCacheKey } from '../Enums';
import { Category, StatusPayload, ServerActionsResponse } from '../types/Models';
import { createClient } from '@/supabase/server';
import { deleteCacheKeyByKeyPrefix, getCacheData, setCacheData } from './redis';

interface SearchParams {
    selectedStatus: string,
    searchTerm: string,
    startIndex: number,
    endIndex: number
}

export async function fetchCategories({selectedStatus, searchTerm, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const cacheKey = `${RedisCacheKey.categories}_${selectedStatus}_${searchTerm}_${startIndex}_${endIndex}`;
    const cachedData = await getCacheData(cacheKey);
    if (!cachedData) {
        let query = supabase.from(DATABASE_TABLE.categories).select('*', {count: 'exact', head: false})
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

export async function fetchCategoryOptions(): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const cachedData = await getCacheData(RedisCacheKey.categories);
    if (!cachedData) {
        const { data, count, error } = await supabase.from(DATABASE_TABLE.categories)
            .select('id, name', {count: 'exact', head: false})
            .eq('status', RecordStatus.ACTIVE)
            .order('name', { ascending: true })
        
        // Return from DB and update the cache asyncronously
        setCacheData(RedisCacheKey.categories, { data, count, error });
        return { data, count, error }
    }

    return cachedData;
}

export async function saveCategory(requestData: Category): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.categories)
        .insert(requestData)
        .select();

    deleteCacheKeyByKeyPrefix(RedisCacheKey.categories);
    return { data, error };
}

export async function updateCategory(id: string, requestData: Category): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.categories)
        .update(requestData)
        .eq('id', id)
        .select();
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.categories);
    return { data, error };
}

export async function updateCategoryRecordStatus(id: string, requestData: StatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.categories)
        .update(requestData)
        .eq('id', id)
        .select();
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.categories);
    return { data, error };
}
