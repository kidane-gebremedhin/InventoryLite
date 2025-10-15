'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE } from '../Enums';
import { RecordStatusPayload, ServerActionsResponse, UserSubscriptionInfo } from '../types/Models';

export async function updateUserSubscriptionInfo(email: string, requestData: Partial<UserSubscriptionInfo>): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.tenants)
        .update(requestData)
        .eq('email', email)
        .select();

    return { data, error };
}

export async function updateTenantRecordStatus(id: string, requestData: RecordStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.tenants)
        .update(requestData)
        .eq('id', id)
        .select();
    
    return { data, error };
}
