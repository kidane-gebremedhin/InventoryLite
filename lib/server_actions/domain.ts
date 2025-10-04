'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE } from '../Enums';
import { Domain, RecordStatusPayload, ServerActionsResponse } from '../types/Models';

export async function saveDomain(requestData: Domain): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.domains)
        .insert(requestData);
    
    return { data, error };
}

export async function updateDomain(id: string, requestData: Domain): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.domains)
        .update(requestData)
        .eq('id', id);
    
    return { data, error };
}

export async function updateDomainRecordStatus(id: string, requestData: RecordStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.domains)
        .update(requestData)
        .eq('id', id)
    
    return { data, error };
}
