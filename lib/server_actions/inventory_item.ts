'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RecordStatus, RedisCacheKey, RPC_FUNCTION } from '../Enums';
import { InventoryItem, StatusPayload, ServerActionsResponse, InventoryItemData } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';
import { deleteCacheKeyByKeyPrefix, getCacheData, setCacheData } from './redis';

interface SearchParams {
    selectedCategoryId: string,
    selectedStatus: string,
    searchTerm: string,
    startIndex: number,
    endIndex: number
}

export async function fetchInvetoryItems({selectedCategoryId, selectedStatus, searchTerm, startIndex, endIndex}: SearchParams, cacheEnabled: boolean = true): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const cacheKey = `${RedisCacheKey.inventory_items}_${selectedCategoryId}_${selectedStatus}_${searchTerm}_${startIndex}_${endIndex}`;
    const cachedData = await getCacheData(cacheKey);
    if (!cacheEnabled || !cachedData) {
        let query = supabase.from(DATABASE_TABLE.inventory_items).select(`
            *,
            category:categories(*),
            purchase_order_items:purchase_order_items(*),
            sales_order_items:sales_order_items(*),
            item_variants:inventory_item_variants(
            *,
            variant:variants(*)
            )
            `, {count: 'exact', head: false})

        if (selectedStatus !== ALL_OPTIONS) {
            query = query.eq('status', selectedStatus);
        }
        if (selectedCategoryId !== ALL_OPTIONS) {
            query = query.eq('category_id', selectedCategoryId);
        }
        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%, sku.ilike.%${searchTerm}%`);
        }

        const { data, count, error } = await query.order('created_at', { ascending: false })
        .range(startIndex, endIndex)

        // Return from DB and update the cache asyncronously
        setCacheData(cacheKey, { data, count, error });
        return { data, count, error };
    }

    return cachedData;
}

export async function fetchInventoryItemOptions(): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const cachedData = await getCacheData(RedisCacheKey.inventory_items);
    if (!cachedData) {
        const { data, count, error } = await supabase.from(DATABASE_TABLE.inventory_items)
            .select(`id, sku, name, unit_price, quantity,
                item_variants:inventory_item_variants(
                    *,
                    variant:variants(*)
                )`, {count: 'exact', head: false})
            .eq('status', RecordStatus.ACTIVE)
            .order('name', { ascending: true })
        
        // Return from DB and update the cache asyncronously
        setCacheData(RedisCacheKey.inventory_items, { data, count, error });
        return { data, count, error }
    }

    return cachedData;
}

export async function saveInventoryItem(requestData: InventoryItemData): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const { data, error } = await supabase
            .rpc(RPC_FUNCTION.TRANSACTION_INVENTORY_ITEM_HANDLER, requestData)
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.inventory_items);
    return { data, error };
}

export async function updateInventoryItem(requestData: InventoryItemData): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .rpc(RPC_FUNCTION.TRANSACTION_INVENTORY_ITEM_HANDLER, requestData)

    deleteCacheKeyByKeyPrefix(RedisCacheKey.inventory_items);
    return { data, error };
}

export async function updateInventoryItemRecordStatus(id: string, requestData: StatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.inventory_items)
        .update(requestData)
        .eq('id', id)
        .select();
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.inventory_items);
    return { data, error };
}
