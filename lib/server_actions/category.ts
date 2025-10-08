'use server';

import { ALL_OPTIONS } from '../Constants';
import { DATABASE_TABLE, RecordStatus } from '../Enums';
import { Category, RecordStatusPayload, ServerActionsResponse } from '../types/Models';
import { createClient } from '@/supabase/server';

interface SearchParams {
    selectedStatus: string,
    searchTerm: string,
    startIndex: number,
    endIndex: number
}

export async function fetchCategories({selectedStatus, searchTerm, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    let query = supabase.from(DATABASE_TABLE.categories).select('*', {count: 'exact', head: false})
    if (selectedStatus !== ALL_OPTIONS) {
        query = query.eq('status', selectedStatus)
    }
    if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%`)
    }
    const { data, count, error } = await query.order('created_at', { ascending: false })
    .range(startIndex, endIndex)

    return { data, count, error };
}

export async function fetchCategoryOptions(): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const { data, count, error } = await supabase.from(DATABASE_TABLE.categories)
        .select('id, name', {count: 'exact', head: false})
        .eq('status', RecordStatus.ACTIVE)
        .order('name', { ascending: true })

    return { data, count, error };
}

export async function saveCategory(requestData: Category): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.categories)
        .insert(requestData);

    return { data, error };
}

export async function updateCategory(id: string, requestData: Category): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.categories)
        .update(requestData)
        .eq('id', id);
    
    return { data, error };
}

export async function updateCategoryRecordStatus(id: string, requestData: RecordStatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.categories)
        .update(requestData)
        .eq('id', id)
    
    return { data, error };
}
