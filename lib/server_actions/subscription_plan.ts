"use server";

import { createClient } from "@/supabase/server";
import { ALL_OPTIONS } from "../Constants";
import { DATABASE_TABLE, RecordStatus, RedisCacheKey } from "../Enums";
import type {
	ServerActionsResponse,
	StatusPayload,
	SubscriptionPlan,
} from "../types/Models";
import { deleteCacheByKeyPrefix, getCacheData, setCacheData } from "./redis";

interface SearchParams {
	tenantId: string;
	selectedSubscriptionStatus: string;
	selectedCurrencyType: string;
	selectedStatus: string;
	startIndex: number;
	endIndex: number;
}

export async function fetchSubscriptionPlans({
	tenantId,
	selectedSubscriptionStatus,
	selectedCurrencyType,
	selectedStatus,
	startIndex,
	endIndex,
}: SearchParams): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const cacheKey = `${RedisCacheKey.subscription_plans}_${tenantId}_${selectedSubscriptionStatus}_${selectedCurrencyType}_${selectedStatus}_${startIndex}_${endIndex}`;
	const cachedData = await getCacheData(cacheKey);
	if (!cachedData) {
		let query = supabase
			.from(DATABASE_TABLE.subscription_plans)
			.select("*", { count: "exact", head: false });
		if (selectedSubscriptionStatus !== ALL_OPTIONS) {
			query = query.eq("subscription_status", selectedSubscriptionStatus);
		}
		if (selectedCurrencyType !== ALL_OPTIONS) {
			query = query.eq("currency_type", selectedCurrencyType);
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

export async function fetchSubscriptionPlanOptions(
	tenantId: string,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const cacheKey = `${RedisCacheKey.subscription_plans}_${tenantId}`;
	const cachedData = await getCacheData(cacheKey);
	if (!cachedData) {
		const { data, count, error } = await supabase
			.from(DATABASE_TABLE.subscription_plans)
			.select("id, name", { count: "exact", head: false })
			.eq("status", RecordStatus.ACTIVE)
			.order("name", { ascending: true });

		// Return from DB and update the cache asyncronously
		setCacheData(cacheKey, { data, count, error });
		return { data, count, error };
	}

	return cachedData;
}

export async function saveSubscriptionPlan(
	requestData: SubscriptionPlan,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.subscription_plans)
		.insert(requestData)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.subscription_plans}_${data[0].tenant_id}`;
		deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}

export async function updateSubscriptionPlan(
	id: string,
	requestData: SubscriptionPlan,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.subscription_plans)
		.update(requestData)
		.eq("id", id)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.subscription_plans}_${data[0].tenant_id}`;
		deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}

export async function updateSubscriptionPlanRecordStatus(
	id: string,
	requestData: StatusPayload,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.subscription_plans)
		.update(requestData)
		.eq("id", id)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.subscription_plans}_${data[0].tenant_id}`;
		deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}
