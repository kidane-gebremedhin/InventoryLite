'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, PaymentStatus } from '../Enums';
import { ManualPayment, ServerActionsResponse } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';

interface SearchParams {
    selectedStatus: string,
    searchTerm: string,
    startIndex: number,
    endIndex: number
}

export async function fetchManualPayments({selectedStatus, searchTerm, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    let query = supabase.from(DATABASE_TABLE.manual_payments).select('*', {count: 'exact', head: false})
    if (selectedStatus !== ALL_OPTIONS) {
        query = query.eq('status', selectedStatus)
    }
    if (searchTerm) {
        query = query.or(`reference_number.ilike.%${searchTerm}%`)
    }

    const { data, count, error } = await query.order('created_at', { ascending: false })
        .range(startIndex, endIndex)

    return { data, count, error };
}

export async function approveManualPayment(id: string): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.manual_payments)
        .update({ status: PaymentStatus.APPROVED })
        .eq('id', id)
        .select();
    
    return { data, error };
}

export async function declineManualPayment(id: string): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.manual_payments)
        .update({ status: PaymentStatus.DECLINED })
        .eq('id', id)
        .select();
    
    return { data, error };
}

export async function saveManualPayment(requestData: ManualPayment): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.manual_payments)
        .insert(requestData)
        .select();
    
    return { data, error };
}

export async function updateManualPayment(id: string, requestData: ManualPayment): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.manual_payments)
        .update(requestData)
        .eq('id', id)
        .select();
    
    return { data, error };
}
