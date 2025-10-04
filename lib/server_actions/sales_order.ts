'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RPC_FUNCTION } from '../Enums';
import { RecordStatusPayload, ServerActionsResponse, SalesOrderData, SalesOrderStatusPayload } from '../types/Models';

export async function saveSalesOrder(requestData: SalesOrderData): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .rpc(RPC_FUNCTION.TRANSACTION_SALES_ORDER_HANDLER, requestData);
    
    return { data, error };
}

export async function updateSalesOrder(requestData: SalesOrderData): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .rpc(RPC_FUNCTION.TRANSACTION_SALES_ORDER_HANDLER, requestData);
    
    return { data, error };
}

export async function updateSalesOrderRecordStatus(id: string, requestData: RecordStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.sales_orders)
        .update(requestData)
        .eq('id', id)
    
    return { data, error };
}

export async function updateSalesOrderStatus(id: string, requestData: SalesOrderStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.sales_orders)
        .update(requestData)
        .eq('id', id)
    
    return { data, error };
}
