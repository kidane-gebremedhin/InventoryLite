'use server';

import { createClient } from '@/supabase/server';
import { ServerActionsResponse, UserFeedback } from '../types/Models';
import { DATABASE_TABLE, FeedbackStatus, RedisCacheKey } from '../Enums';
import { ALL_OPTIONS } from '../Constants';
import { getCacheData, setCacheData } from './redis';

interface SearchParams {
    selectedStatus: string,
    selectedCategory: string,
    selectedPriority: string,
    selectedRating: number,
    searchTerm: string,
    startIndex: number,
    endIndex: number
}

export async function fetchUserFeedbacks({selectedStatus, selectedCategory, selectedPriority, selectedRating, searchTerm, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const cacheKey = `${RedisCacheKey.feedback}_${selectedStatus}_${selectedCategory}_${selectedPriority}_${selectedRating}_${searchTerm}_${startIndex}_${endIndex}`;
    const cachedData = await getCacheData(cacheKey);
    if (!cachedData) {
        let query = supabase.from(DATABASE_TABLE.feedback).select('*', {count: 'exact', head: false})
        if (selectedStatus !== ALL_OPTIONS) {
            query = query.eq('status', selectedStatus)
        }
        if (selectedCategory !== ALL_OPTIONS) {
            query = query.eq('category', selectedCategory)
        }
        if (selectedPriority !== ALL_OPTIONS) {
            query = query.eq('priority', selectedPriority)
        }
        if (!selectedRating) {
            query = query.eq('rating', selectedRating)
        }
        if (searchTerm) {
            query = query.or(`subject.ilike.%${searchTerm}%, message.ilike.%${searchTerm}%, admin_response.ilike.%${searchTerm}%`)
        }
        
        const { data, count, error } = await query.order('created_at', { ascending: false })
            .range(startIndex, endIndex)


        // Return from DB and update the cache asyncronously
        setCacheData(cacheKey, { data, count, error });
        return { data, count, error };
    }

    return cachedData;
}

export async function manageUserFeedbacks({selectedStatus, selectedCategory, selectedPriority, selectedRating, searchTerm, startIndex, endIndex}: SearchParams): Promise<ServerActionsResponse> {
    const supabase = await createClient();
    
    const cacheKey = `${RedisCacheKey.feedback}_${selectedStatus}_${selectedCategory}_${selectedPriority}_${selectedRating}_${searchTerm}_${startIndex}_${endIndex}`;
    const cachedData = await getCacheData(cacheKey);
    if (!cachedData) {
        let query = supabase.from(DATABASE_TABLE.feedback)
            .select(`
            *,
            tenant:tenants(domain_id, name, email)
            `, {count: 'exact', head: false})

        if (selectedStatus !== ALL_OPTIONS) {
            query = query.eq('status', selectedStatus)
        }
        if (selectedCategory !== ALL_OPTIONS) {
            query = query.eq('category', selectedCategory)
        }
        if (selectedPriority !== ALL_OPTIONS) {
            query = query.eq('priority', selectedPriority)
        }
        if (selectedRating > 0) {
            query = query.eq('rating', selectedRating)
        }
        if (searchTerm) {
            query = query.or(`subject.ilike.%${searchTerm}%, message.ilike.%${searchTerm}%, admin_response.ilike.%${searchTerm}%`)
        }
        
        const { data, count, error } = await query.order('created_at', { ascending: false })
            .range(startIndex, endIndex)

        // Return from DB and update the cache asyncronously
        setCacheData(cacheKey, { data, count, error });
        return { data, count, error };
    }

    return cachedData;
}

export async function saveUserFeedback(formData: UserFeedback): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from(DATABASE_TABLE.feedback)
        .insert({
            category: formData.category,
            subject: formData.subject,
            message: formData.message,
            priority: formData.priority,
            rating: formData.rating > 0 ? formData.rating : null
        })
        .select();

    return { data, error };
}

export async function updateFeedbackStatus({feedbackId, newStatus}: {feedbackId: string, newStatus: string }): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from(DATABASE_TABLE.feedback)
        .update({ status: newStatus })
        .eq('id', feedbackId)
        .select();

    return { data, error };
}

export async function saveRatingFeedback({category, subject, message, priority, rating}: {category: string, subject: string, message: string, priority: string, rating: number }): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from(DATABASE_TABLE.feedback)
        .insert({category, subject, message, priority, rating})
        .select()

    return { data, error };
}

export async function fetchUnreadCount(): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const cachedData = await getCacheData(RedisCacheKey.feedback_unread_count);
    if (!cachedData) {
        const { data, error } = await supabase
            .from(DATABASE_TABLE.feedback)
            .select('id')
            .eq('status', FeedbackStatus.OPEN)
        
        // Return from DB and update the cache asyncronously
        setCacheData(RedisCacheKey.feedback_unread_count, { data, error });
        return { data, error }
    }

    return cachedData;
}

export async function fetchFeedbackStats(): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const cachedData = await getCacheData(RedisCacheKey.feedback_stats);
    if (!cachedData) {
        const { data, error } = await supabase
        .from(DATABASE_TABLE.feedback)
        .select('*')

        // Return from DB and update the cache asyncronously
        setCacheData(RedisCacheKey.feedback_stats, { data, error });
        return { data, error }
    }

    return cachedData;  
}

export async function saveFeedbackAdminResponse({feedbackId, responseText, status}: {feedbackId: string, responseText: string, status: string }): Promise<ServerActionsResponse> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from(DATABASE_TABLE.feedback)
        .update({ 
          admin_response: responseText,
          status: status
        })
        .eq('id', feedbackId)
        .select();

    return { data, error };
}
