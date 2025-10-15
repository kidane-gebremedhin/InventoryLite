'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RPC_FUNCTION } from '../Enums';
import { PurchaseOrderData, PurchaseOrderStatusPayload, RecordStatusPayload, ServerActionsHeader, ServerActionsResponse } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';
import { convertToUTC, setEarliestTimeOfDay, setLatestTimeOfDay } from '../helpers/Helper';

interface SearchParams {
    selectedOrderStatus: string,
    selectedStatus: string,
    selectedSupplierId: string,
    searchTerm: string,
    startDate: Date,
    endDate: Date,
    receivedDateStart: Date,
    receivedDateEnd: Date,
    startIndex: number,
    endIndex: number
}

export async function fetchPurchaseOrders({selectedOrderStatus, selectedStatus, selectedSupplierId, searchTerm, startDate, endDate, receivedDateStart, receivedDateEnd, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
let query = supabase.from(DATABASE_TABLE.purchase_orders).select(`
        *,
        supplier:suppliers(*),
        order_items:purchase_order_items(
        *,
        item:inventory_items(*),
        store:stores(*)
        )`,
        {count: 'exact', head: false})

    if (selectedOrderStatus !== ALL_OPTIONS) {
        query = query.eq('order_status', selectedOrderStatus)
    }
    if (selectedStatus !== ALL_OPTIONS) {
        query = query.eq('status', selectedStatus)
    }
    if (selectedSupplierId !== ALL_OPTIONS) {
        query = query.eq('supplier_id', selectedSupplierId);
    }
    if (searchTerm) {
        query = query.or(`po_number.ilike.%${searchTerm}%`)
    }
    if (startDate) {
        const startDateUTC = convertToUTC(setEarliestTimeOfDay(startDate))
        query = query.gte('expected_date', startDateUTC.toUTCString())
    }
    if (endDate) {
        const endDateUTC = convertToUTC(setLatestTimeOfDay(endDate))
        query = query.lte('expected_date', endDateUTC.toUTCString())
    }
    if (receivedDateStart) {
        const receivedDateStartUTC = convertToUTC(setEarliestTimeOfDay(receivedDateStart))
        query = query.gte('received_date', receivedDateStartUTC.toUTCString())
    }
    if (receivedDateEnd) {
        const receivedDateEndUTC = convertToUTC(setLatestTimeOfDay(receivedDateEnd))
        query = query.lte('received_date', receivedDateEndUTC.toUTCString())
    }

    const { data, count, error } = await query.order('created_at', { ascending: false })
        .range(startIndex, endIndex)

    return { data, count, error };
}

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
        .select();
    
    return { data, error };
}

export async function updatePurchaseOrderStatus(id: string, requestData: PurchaseOrderStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.purchase_orders)
        .update(requestData)
        .eq('id', id)
        .select();
    
    return { data, error };
}
