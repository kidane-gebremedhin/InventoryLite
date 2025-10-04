'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE } from '../Enums';
import { Supplier, RecordStatusPayload, ServerActionsResponse } from '../types/Models';

export async function saveSupplier(requestData: Supplier): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.suppliers)
        .insert(requestData);
    
    return { data, error };
}

export async function updateSupplier(id: string, requestData: Supplier): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.suppliers)
        .update(requestData)
        .eq('id', id);
    
    return { data, error };
}

export async function updateSupplierRecordStatus(id: string, requestData: RecordStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.suppliers)
        .update(requestData)
        .eq('id', id)
    
    return { data, error };
}
