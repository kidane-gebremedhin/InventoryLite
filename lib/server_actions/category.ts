'use server';

import { DATABASE_TABLE } from '../Enums';
import { Category, RecordStatusPayload, ServerActionsResponse } from '../types/Models';
import { createClient } from '@/supabase/server';

export async function saveCategory(requestData: Category/**/): Promise<ServerActionsResponse> {
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
