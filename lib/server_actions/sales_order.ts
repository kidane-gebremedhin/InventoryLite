'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RPC_FUNCTION } from '../Enums';
import { RecordStatusPayload, ServerActionsResponse, SalesOrderData, SalesOrderStatusPayload } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';
import { convertToUTC, setEarliestTimeOfDay, setLatestTimeOfDay } from '../helpers/Helper';

interface SearchParams {
    selectedOrderStatus: string,
    selectedStatus: string,
    selectedCustomerId: string,
    searchTerm: string,
    startDate: Date,
    endDate: Date,
    fulfilledDateStart: Date,
    fulfilledDateEnd: Date,
    startIndex: number,
    endIndex: number
}

export async function fetchSalesOrders({selectedOrderStatus, selectedStatus, selectedCustomerId, searchTerm, startDate, endDate, fulfilledDateStart, fulfilledDateEnd, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    let query = supabase.from(DATABASE_TABLE.sales_orders).select(`
        *,
        customer:customers(*),
        order_items:sales_order_items(
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
    if (selectedCustomerId !== ALL_OPTIONS) {
        query = query.eq('customer_id', selectedCustomerId);
    }
    if (searchTerm) {
        query = query.or(`so_number.ilike.%${searchTerm}%`)
    }
    if (startDate) {
        const startDateUTC = convertToUTC(setEarliestTimeOfDay(startDate))
        query = query.gte('expected_date', startDateUTC.toUTCString())
    }
    if (endDate) {
        const endDateUTC = convertToUTC(setLatestTimeOfDay(endDate))
        query = query.lte('expected_date', endDateUTC.toUTCString())
    }
    if (fulfilledDateStart) {
        const fulfilledDateStartUTC = convertToUTC(setEarliestTimeOfDay(fulfilledDateStart))
        query = query.gte('fulfilled_date', fulfilledDateStartUTC.toUTCString())
    }
    if (fulfilledDateEnd) {
        const fulfilledDateEndUTC = convertToUTC(setLatestTimeOfDay(fulfilledDateEnd))
        query = query.lte('fulfilled_date', fulfilledDateEndUTC.toUTCString())
    }

    const { data, count, error } = await query.order('created_at', { ascending: false })
        .range(startIndex, endIndex)

    return { data, count, error };
}

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
