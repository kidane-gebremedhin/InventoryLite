'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RedisCacheKey } from '../Enums';
import { Supplier, StatusPayload, ServerActionsResponse } from '../types/Models';
import { ALL_OPTIONS } from '../Constants';
import { convertToUTC, setEarliestTimeOfDay } from '../helpers/Helper';
import { getCacheData, setCacheData } from './redis';

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

    const cacheKey = `${RedisCacheKey.transactions}_${selectedStatus}_${selectedDirection}_${selectedStoreId}_${selectedInventoryItemId}_${startDate}_${endDate}_${startIndex}_${endIndex}`;
    const cachedData = await getCacheData(cacheKey);
    if (!cachedData) {
        let query = supabase.from(DATABASE_TABLE.transactions).select(`
            *,
            item:inventory_items(*),
            store:stores(*)
            `, {count: 'exact', head: false})

        if (selectedStatus !== ALL_OPTIONS) {
            query = query.eq('status', selectedStatus)
        }
        if (selectedDirection !== ALL_OPTIONS) {
            query = query.eq('direction', selectedDirection);
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

        // Return from DB and update the cache asyncronously
        setCacheData(cacheKey, { data, count, error });
        return { data, count, error };
    }

    return cachedData;
}

