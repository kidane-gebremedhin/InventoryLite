"use server";

import { createClient } from "@/supabase/server";
import { ALL_OPTIONS } from "../Constants";
import { DATABASE_TABLE, RecordStatus, RedisCacheKey } from "../Enums";
import type {
	ServerActionsResponse,
	StatusPayload,
	Store,
} from "../types/Models";
import { deleteCacheByKeyPrefix, getCacheData, setCacheData } from "./redis";

interface SearchParams {
	tenantId: string;
	selectedStatus: string;
	searchTerm: string;
	startIndex: number;
	endIndex: number;
}

export async function fetchStores({
	tenantId,
	selectedStatus,
	searchTerm,
	startIndex,
	endIndex,
}: SearchParams): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const cacheKey = `${RedisCacheKey.stores}_${tenantId}_${selectedStatus}_${searchTerm}_${startIndex}_${endIndex}`;
	const cachedData = await getCacheData(cacheKey);
	if (!cachedData || cachedData.data?.length === 0) {
		let query = supabase
			.from(DATABASE_TABLE.stores)
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
		if (tenantId) {
			setCacheData(cacheKey, { data, count, error });
		}
		return { data, count, error };
	}

	return cachedData;
}

export async function fetchStoreOptions(
	tenantId: string,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const cacheKey = `${RedisCacheKey.stores}_${tenantId}`;
	const cachedData = await getCacheData(cacheKey);
	if (!cachedData || cachedData.data?.length === 0) {
		const { data, count, error } = await supabase
			.from(DATABASE_TABLE.stores)
			.select("id, name", { count: "exact", head: false })
			.eq("status", RecordStatus.ACTIVE)
			.order("name", { ascending: true });

		// Return from DB and update the cache asyncronously
		if (tenantId) {
			setCacheData(cacheKey, { data, count, error });
		}
		return { data, count, error };
	}

	return cachedData;
}

export async function saveStore(
	requestData: Store,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.stores)
		.insert(requestData)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.stores}_${data[0].tenant_id}`;
		await deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}

export async function updateStore(
	id: string,
	requestData: Store,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.stores)
		.update(requestData)
		.eq("id", id)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.stores}_${data[0].tenant_id}`;
		await deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}

export async function updateStoreRecordStatus(
	id: string,
	requestData: StatusPayload,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.stores)
		.update(requestData)
		.eq("id", id)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.stores}_${data[0].tenant_id}`;
		await deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}
