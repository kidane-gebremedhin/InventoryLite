'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RedisCacheKey, RPC_FUNCTION } from '../Enums';
import { PurchaseOrderData, PurchaseOrderStatusPayload, StatusPayload, ServerActionsHeader, ServerActionsResponse } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';
import { convertToUTC, setEarliestTimeOfDay, setLatestTimeOfDay } from '../helpers/Helper';
import { deleteCacheKeyByKeyPrefix, getCacheData, setCacheData } from './redis';

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

    const cacheKey = `${RedisCacheKey.purchase_orders}_${selectedOrderStatus}_${selectedStatus}_${selectedSupplierId}_${searchTerm}_${startDate}_${endDate}_${receivedDateStart}_${receivedDateEnd}_${startIndex}_${endIndex}`;
    const cachedData = await getCacheData(cacheKey);
    if (!cachedData) {
        let query = supabase.from(DATABASE_TABLE.purchase_orders).select(`
            *,
            supplier:suppliers(*),
            order_items:purchase_order_items(
            *,
            item:inventory_items(*),
            variant:variants(*),
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

        // Return from DB and update the cache asyncronously
        setCacheData(cacheKey, { data, count, error });
        return { data, count, error };
    }

    return cachedData;
}

export async function savePurchaseOrder(requestData: PurchaseOrderData): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .rpc(RPC_FUNCTION.TRANSACTION_PURCHASE_ORDER_HANDLER, requestData)
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.purchase_orders);
    deleteCacheKeyByKeyPrefix(RedisCacheKey.transactions);
    return { data, error };
}

export async function updatePurchaseOrder(requestData: PurchaseOrderData): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .rpc(RPC_FUNCTION.TRANSACTION_PURCHASE_ORDER_HANDLER, requestData);
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.purchase_orders);
    deleteCacheKeyByKeyPrefix(RedisCacheKey.transactions);
    return { data, error };
}

export async function updatePurchaseOrderRecordStatus(id: string, requestData: StatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.purchase_orders)
        .update(requestData)
        .eq('id', id)
        .select();
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.purchase_orders);
    deleteCacheKeyByKeyPrefix(RedisCacheKey.transactions);
    return { data, error };
}

export async function updatePurchaseOrderStatus(id: string, requestData: PurchaseOrderStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.purchase_orders)
        .update(requestData)
        .eq('id', id)
        .select();
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.purchase_orders);
    deleteCacheKeyByKeyPrefix(RedisCacheKey.transactions);
    return { data, error };
}
