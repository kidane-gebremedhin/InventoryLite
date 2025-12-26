"use server";

import { createClient } from "@/supabase/server";
import { ALL_OPTIONS } from "../Constants";
import { DATABASE_TABLE, RecordStatus, RedisCacheKey } from "../Enums";
import type {
	Domain,
	ServerActionsResponse,
	StatusPayload,
} from "../types/Models";
import { deleteCacheByKeyPrefix, getCacheData, setCacheData } from "./redis";

interface SearchParams {
	tenantId: string;
	selectedStatus: string;
	searchTerm: string;
	startIndex: number;
	endIndex: number;
}

export async function fetchDomains({
	tenantId,
	selectedStatus,
	searchTerm,
	startIndex,
	endIndex,
}: SearchParams): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const cacheKey = `${RedisCacheKey.domains}_${tenantId}_${selectedStatus}_${searchTerm}_${startIndex}_${endIndex}`;
	const cachedData = await getCacheData(cacheKey);
	if (!cachedData) {
		let query = supabase
			.from(DATABASE_TABLE.domains)
			.select("*", { count: "exact", head: false });
		if (selectedStatus !== ALL_OPTIONS) {
			query = query.eq("status", selectedStatus);
		}
		if (searchTerm) {
			query = query.or(
				`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%`,
			);
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

export async function fetchDomainOptions(
	tenantId: string,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const cacheKey = `${RedisCacheKey.domains}_${tenantId}`;
	const cachedData = await getCacheData(cacheKey);
	if (!cachedData) {
		const { data, count, error } = await supabase
			.from(DATABASE_TABLE.domains)
			.select("id, name", { count: "exact", head: false })
			.eq("status", RecordStatus.ACTIVE)
			.order("name", { ascending: true });

		// Return from DB and update the cache asyncronously
		setCacheData(cacheKey, { data, count, error });
		return { data, count, error };
	}

	return cachedData;
}

export async function saveDomain(
	requestData: Domain,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.domains)
		.insert(requestData)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.domains}_${data[0].tenant_id}`;
		deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}

export async function updateDomain(
	id: string,
	requestData: Domain,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.domains)
		.update(requestData)
		.eq("id", id)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.domains}_${data[0].tenant_id}`;
		deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}

export async function updateDomainRecordStatus(
	id: string,
	requestData: StatusPayload,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.domains)
		.update(requestData)
		.eq("id", id)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.domains}_${data[0].tenant_id}`;
		deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}
