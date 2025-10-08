'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RecordStatus } from '../Enums';
import { Store, RecordStatusPayload, ServerActionsResponse } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';

interface SearchParams {
    selectedStatus: string,
    searchTerm: string,
    startIndex: number,
    endIndex: number
}

export async function fetchStores({selectedStatus, searchTerm, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    let query = supabase.from(DATABASE_TABLE.stores).select('*', {count: 'exact', head: false})
    if (selectedStatus !== ALL_OPTIONS) {
        query = query.eq('status', selectedStatus)
    }
    if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%`)
    }
    
    const { data, count, error } = await query.order('created_at', { ascending: false })
        .range(startIndex, endIndex)

    return { data, count, error };
}

export async function fetchStoreOptions(): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const { data, count, error } = await supabase.from(DATABASE_TABLE.stores)
        .select('id, name', {count: 'exact', head: false})
        .eq('status', RecordStatus.ACTIVE)
        .order('name', { ascending: true })

    return { data, count, error };
}

export async function saveStore(requestData: Store): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.stores)
        .insert(requestData);
    
    return { data, error };
}

export async function updateStore(id: string, requestData: Store): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.stores)
        .update(requestData)
        .eq('id', id);
    
    return { data, error };
}

export async function updateStoreRecordStatus(id: string, requestData: RecordStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.stores)
        .update(requestData)
        .eq('id', id)
    
    return { data, error };
}
