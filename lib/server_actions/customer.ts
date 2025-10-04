'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE } from '../Enums';
import { Customer, RecordStatusPayload, ServerActionsResponse } from '../types/Models';

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
