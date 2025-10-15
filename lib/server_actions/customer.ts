'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RecordStatus, RedisCacheKey } from '../Enums';
import { Customer, RecordStatusPayload, ServerActionsResponse } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';
import { getCacheData, setCacheData } from './redis';

interface SearchParams {
    selectedStatus: string,
    searchTerm: string,
    startIndex: number,
    endIndex: number
}

export async function fetchCustomers({selectedStatus, searchTerm, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const cacheKey = `${RedisCacheKey.customers}_${selectedStatus}_${searchTerm}_${startIndex}_${endIndex}`;
    const cachedData = await getCacheData(cacheKey);
    if (!cachedData) {
        let query = supabase.from(DATABASE_TABLE.customers).select('*', {count: 'exact', head: false})
            if (selectedStatus !== ALL_OPTIONS) {
                query = query.eq('status', selectedStatus)
            }
            if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%, email.ilike.%${searchTerm}%, phone.ilike.%${searchTerm}%, address.ilike.%${searchTerm}%`)
            }
            const { data, count, error } = await query.order('created_at', { ascending: false })
            .range(startIndex, endIndex)

        // Return from DB and update the cache asyncronously
        setCacheData(cacheKey, { data, count, error });
        return { data, count, error };
    }

    return cachedData;
}

export async function fetchCustomerOptions(): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const cachedData = await getCacheData(RedisCacheKey.customers);
    if (!cachedData) {
        const { data, count, error } = await supabase.from(DATABASE_TABLE.customers)
            .select('id, name', {count: 'exact', head: false})
            .eq('status', RecordStatus.ACTIVE)
            .order('name', { ascending: true })
        
        // Return from DB and update the cache asyncronously
        setCacheData(RedisCacheKey.customers, { data, count, error });
        return { data, count, error }
    }

    return cachedData;
}

export async function saveCustomer(requestData: Customer): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.customers)
        .insert(requestData)
        .select();
    
    return { data, error };
}

export async function updateCustomer(id: string, requestData: Customer): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.customers)
        .update(requestData)
        .eq('id', id)
        .select();
    
    return { data, error };
}

export async function updateCustomerRecordStatus(id: string, requestData: RecordStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.customers)
        .update(requestData)
        .eq('id', id)
        .select();
    
    return { data, error };
}
