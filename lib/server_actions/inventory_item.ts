'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RecordStatus } from '../Enums';
import { InventoryItem, RecordStatusPayload, ServerActionsResponse } from '../types/Models';

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
