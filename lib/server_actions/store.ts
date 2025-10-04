'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE } from '../Enums';
import { Store, RecordStatusPayload, ServerActionsResponse } from '../types/Models';

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
