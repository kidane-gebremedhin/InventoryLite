'use server';

import { insertSeedData } from '../db_queries/DBQuery';
import { createClient } from '@/supabase/server';

export async function triggerInsertSeedData() {
    const supabase = await createClient();
    
    await insertSeedData(supabase);
}
