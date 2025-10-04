'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE } from '../Enums';
import { ManualPaymentStatusPayload, ServerActionsResponse } from '../types/Models';

export async function approveManualPayment(id: string, requestData: ManualPaymentStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.manual_payments)
        .update(requestData)
        .eq('id', id);
    
    return { data, error };
}
