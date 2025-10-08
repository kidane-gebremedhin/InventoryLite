'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE } from '../Enums';
import { Supplier, RecordStatusPayload, ServerActionsResponse } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';
import { convertToUTC, setEarliestTimeOfDay } from '../helpers/Helper';

interface SearchParams {
    selectedStatus: string,
    selectedDirection: string,
    selectedStoreId: string,
    selectedInventoryItemId: string,
    startDate: Date,
    endDate: Date,
    startIndex: number,
    endIndex: number
}

export async function fetchTransactions({selectedStatus, selectedDirection, selectedStoreId, selectedInventoryItemId, startDate, endDate, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    let query = supabase.from(DATABASE_TABLE.transactions).select(`
        *,
        item:inventory_items(*),
        store:stores(*)
        `, {count: 'exact', head: false})

    if (selectedStatus !== ALL_OPTIONS) {
        query = query.eq('status', selectedStatus)
    }
    if (selectedDirection !== ALL_OPTIONS) {
        query = query.eq('type', selectedDirection);
    }
    if (selectedStoreId !== ALL_OPTIONS) {
        query = query.eq('store_id', selectedStoreId);
    }
    if (selectedInventoryItemId !== ALL_OPTIONS) {
        query = query.eq('item_id', selectedInventoryItemId);
    }
    if (startDate) {
        const startDateUTC = convertToUTC(setEarliestTimeOfDay(startDate))
        query = query.gte('created_at', startDateUTC.toUTCString())
    }
    if (endDate) {
        const endDateUTC = convertToUTC(setEarliestTimeOfDay(endDate))
        query = query.lte('created_at', endDateUTC.toUTCString())
    }
    const { data, count, error } = await query.order('created_at', { ascending: false })
        .range(startIndex, endIndex)

    return { data, count, error };
}

export async function saveSupplier(requestData: Supplier): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.suppliers)
        .insert(requestData);
    
    return { data, error };
}

export async function updateSupplier(id: string, requestData: Supplier): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.suppliers)
        .update(requestData)
        .eq('id', id);
    
    return { data, error };
}

export async function updateSupplierRecordStatus(id: string, requestData: RecordStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.suppliers)
        .update(requestData)
        .eq('id', id)
    
    return { data, error };
}
