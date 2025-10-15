'use server'

import { createClient } from '@/supabase/server';
import { ServerActionsResponse } from '../types/Models';

export async function makeRpcCall(rpcFunctionName: string, searchParams?: any): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    // RPC call
    const { data, error } = await supabase
              .rpc(rpcFunctionName, searchParams);
    
    return { data, error };
}
