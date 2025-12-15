'use server';

import { createClient } from '@/supabase/server';
import { DATABASE_TABLE, RedisCacheKey } from '../Enums';
import { UserInvitation, StatusPayload, ServerActionsResponse } from '../types/Models';
import { ALL_OPTIONS, USER_INVITATION_EXPIRY_HOURS } from '../Constants';
import { deleteCacheKeyByKeyPrefix, getCacheData, setCacheData } from './redis';
import crypto from 'crypto';
import { convertToUTC } from '../helpers/Helper';
import { sendMail } from './mail';

interface SearchParams {
    selectedStatus: string,
    searchTerm: string,
    startIndex: number,
    endIndex: number
}

export async function fetchUserInvitations({selectedStatus, searchTerm, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const cacheKey = `${RedisCacheKey.tenant_user_invites}_${selectedStatus}_${searchTerm}_${startIndex}_${endIndex}`;
    const cachedData = await getCacheData(cacheKey);
    if (!cachedData) {
        let query = supabase.from(DATABASE_TABLE.tenant_user_invites).select('*', {count: 'exact', head: false})
            if (selectedStatus !== ALL_OPTIONS) {
                query = query.eq('status', selectedStatus)
            }
            if (searchTerm) {
                query = query.or(`email.ilike.%${searchTerm}%`)
            }
            const { data, count, error } = await query.order('created_at', { ascending: false })
            .range(startIndex, endIndex)

        // Return from DB and update the cache asyncronously
        setCacheData(cacheKey, { data, count, error });
        return { data, count, error };
    }

    return cachedData;
}

export async function saveUserInvitation(requestData: Partial<UserInvitation>): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    // Generates a secure, 64-character token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + USER_INVITATION_EXPIRY_HOURS);
    const invitationLink = `${process.env.APP_URL}/auth/login?token=${token}`;

    requestData = {
        ...requestData,
        ...{
            token: token,
            expires_at: convertToUTC(expiresAt).toUTCString()
        }
    }
    const { data, error } = await supabase
        .from(DATABASE_TABLE.tenant_user_invites)
        .insert(requestData)
        .select();

    if (!error) {
        const { data: emailResponse, error: emailError } = await sendMail({ email: requestData.email, invitationLink })
        if (emailError) {
            console.log(`Failed to send invitation email to ${requestData.email}`);
        }
    }

    deleteCacheKeyByKeyPrefix(RedisCacheKey.tenant_user_invites);
    return { data, error };
}

export async function updateUserInvitation(id: string, requestData: Partial<UserInvitation>): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.tenant_user_invites)
        .update(requestData)
        .eq('id', id)
        .select();
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.tenant_user_invites);
    return { data, error };
}

export async function updateUserInvitationStatus(id: string, requestData: StatusPayload): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from(DATABASE_TABLE.tenant_user_invites)
        .update(requestData)
        .eq('id', id)
        .select();
    
    deleteCacheKeyByKeyPrefix(RedisCacheKey.tenant_user_invites);
    return { data, error };
}
