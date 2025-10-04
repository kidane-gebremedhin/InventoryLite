'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RPC_FUNCTION } from '../Enums';
import { PurchaseOrderData, PurchaseOrderStatusPayload, RecordStatusPayload, ServerActionsHeader, ServerActionsResponse } from '../types/Models';

export async function savePurchaseOrder(requestData: PurchaseOrderData): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .rpc(RPC_FUNCTION.TRANSACTION_PURCHASE_ORDER_HANDLER, requestData)
    
    return { data, error };
}

export async function updatePurchaseOrder(requestData: PurchaseOrderData): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .rpc(RPC_FUNCTION.TRANSACTION_PURCHASE_ORDER_HANDLER, requestData);
    
    return { data, error };
}

export async function updatePurchaseOrderRecordStatus(id: string, requestData: RecordStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.purchase_orders)
        .update(requestData)
        .eq('id', id)
    
    return { data, error };
}

export async function updatePurchaseOrderStatus(id: string, requestData: PurchaseOrderStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.purchase_orders)
        .update(requestData)
        .eq('id', id)
    
    return { data, error };
}
