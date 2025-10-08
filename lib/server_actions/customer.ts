'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RecordStatus } from '../Enums';
import { Customer, RecordStatusPayload, ServerActionsResponse } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';

interface SearchParams {
    selectedStatus: string,
    searchTerm: string,
    startIndex: number,
    endIndex: number
}

export async function fetchCustomers({selectedStatus, searchTerm, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    let query = supabase.from(DATABASE_TABLE.customers).select('*', {count: 'exact', head: false})
    if (selectedStatus !== ALL_OPTIONS) {
        query = query.eq('status', selectedStatus)
    }
    if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%, email.ilike.%${searchTerm}%, phone.ilike.%${searchTerm}%, address.ilike.%${searchTerm}%`)
    }
    const { data, count, error } = await query.order('created_at', { ascending: false })
    .range(startIndex, endIndex)

    return { data, count, error };
}

export async function fetchCustomerOptions(): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const { data, count, error } = await supabase.from(DATABASE_TABLE.customers)
        .select('id, name', {count: 'exact', head: false})
        .eq('status', RecordStatus.ACTIVE)
        .order('name', { ascending: true })

    return { data, count, error };
}

export async function saveCustomer(requestData: Customer): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.customers)
        .insert(requestData);
    
    return { data, error };
}

export async function updateCustomer(id: string, requestData: Customer): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.customers)
        .update(requestData)
        .eq('id', id);
    
    return { data, error };
}

export async function updateCustomerRecordStatus(id: string, requestData: RecordStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.customers)
        .update(requestData)
        .eq('id', id)
    
    return { data, error };
}
