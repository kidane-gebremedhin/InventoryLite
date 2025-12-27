"use server";

import { createClient } from "@/supabase/server";
import { ALL_OPTIONS } from "../Constants";
import { DATABASE_TABLE, RecordStatus, RedisCacheKey } from "../Enums";
import type {
	AffiliatePartner,
	ServerActionsResponse,
	StatusPayload,
} from "../types/Models";
import { deleteCacheByKeyPrefix, getCacheData, setCacheData } from "./redis";

interface SearchParams {
	searchTerm: string;
	commissionType: string;
	selectedStatus: string;
	startIndex: number;
	endIndex: number;
}

export async function fetchAffiliatePartners({
	searchTerm,
	commissionType,
	selectedStatus,
	startIndex,
	endIndex,
}: SearchParams): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const cacheKey = `${RedisCacheKey.affiliate_partners}_${searchTerm}_${commissionType}_${selectedStatus}_${startIndex}_${endIndex}`;
	const cachedData = await getCacheData(cacheKey);
	if (!cachedData) {
		let query = supabase
			.from(DATABASE_TABLE.affiliate_partners)
			.select("*", { count: "exact", head: false });
		if (commissionType !== ALL_OPTIONS) {
			query = query.eq("commission_type", commissionType);
		}
		if (selectedStatus !== ALL_OPTIONS) {
			query = query.eq("status", selectedStatus);
		}
		const { data, count, error } = await query
			.order("created_at", { ascending: false })
			.range(startIndex, endIndex);

		// Return from DB and update the cache asyncronously
		setCacheData(cacheKey, { data, count, error });
		return { data, count, error };
	}

	return cachedData;
}

export async function fetchAffiliatePartnerOptions(): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const cacheKey = `${RedisCacheKey.affiliate_partners}`;
	const cachedData = await getCacheData(cacheKey);
	if (!cachedData) {
		const { data, count, error } = await supabase
			.from(DATABASE_TABLE.affiliate_partners)
			.select("id, name", { count: "exact", head: false })
			.eq("status", RecordStatus.ACTIVE)
			.order("name", { ascending: true });

		// Return from DB and update the cache asyncronously
		setCacheData(cacheKey, { data, count, error });
		return { data, count, error };
	}

	return cachedData;
}

export async function saveAffiliatePartner(
	requestData: AffiliatePartner,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.affiliate_partners)
		.insert(requestData)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.affiliate_partners}`;
		deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}

export async function updateAffiliatePartner(
	id: string,
	requestData: AffiliatePartner,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.affiliate_partners)
		.update(requestData)
		.eq("id", id)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.affiliate_partners}`;
		deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}

export async function updateAffiliatePartnerRecordStatus(
	id: string,
	requestData: StatusPayload,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.affiliate_partners)
		.update(requestData)
		.eq("id", id)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.affiliate_partners}`;
		deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}
