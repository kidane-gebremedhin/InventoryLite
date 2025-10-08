'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RecordStatus } from '../Enums';
import { InventoryItem, RecordStatusPayload, ServerActionsResponse } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';

interface SearchParams {
    selectedCategoryId: string,
    selectedStatus: string,
    searchTerm: string,
    startIndex: number,
    endIndex: number
}

export async function fetchInvetoryItems({selectedCategoryId, selectedStatus, searchTerm, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    let query = supabase.from(DATABASE_TABLE.inventory_items).select(`
        *,
        category:categories(*),
        purchase_order_items:purchase_order_items(*),
        sales_order_items:sales_order_items(*)
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

    return { data, count, error };
}

export async function fetchInventoryItemOptions(): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const { data, count, error } = await supabase.from(DATABASE_TABLE.inventory_items)
        .select('id, sku, name, unit_price, quantity', {count: 'exact', head: false})
        .eq('status', RecordStatus.ACTIVE)
        .order('name', { ascending: true })

    return { data, count, error };
}

export async function saveInventoryItem(requestData: InventoryItem): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.inventory_items)
        .insert(requestData);
    
    return { data, error };
}

export async function updateInventoryItem(id: string, requestData: InventoryItem): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.inventory_items)
        .update(requestData)
        .eq('id', id);
    
    return { data, error };
}

export async function updateInventoryItemRecordStatus(id: string, requestData: RecordStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.inventory_items)
        .update(requestData)
        .eq('id', id)
    
    return { data, error };
}
