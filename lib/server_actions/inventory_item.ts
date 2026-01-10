"use server";

import { createClient } from "@/supabase/server";
import { ALL_OPTIONS } from "../Constants";
import {
	DATABASE_TABLE,
	DATABASE_TABLE_VIEW,
	RecordStatus,
	RedisCacheKey,
	RPC_FUNCTION,
	StockLevel,
} from "../Enums";
import type {
	InventoryItemData,
	ServerActionsResponse,
	StatusPayload,
} from "../types/Models";
import { deleteCacheByKeyPrefix, getCacheData, setCacheData } from "./redis";

interface SearchParams {
	tenantId: string;
	selectedCategoryId: string;
	selectedStockLevel: string;
	selectedStatus: string;
	searchTerm: string;
	startIndex: number;
	endIndex: number;
}

export async function fetchInvetoryItems(
	{
		tenantId,
		selectedCategoryId,
		selectedStockLevel,
		selectedStatus,
		searchTerm,
		startIndex,
		endIndex,
	}: SearchParams,
	cacheEnabled: boolean = true,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const cacheKey = `${RedisCacheKey.inventory_items}_${tenantId}_${selectedCategoryId}_${selectedStockLevel}_${selectedStatus}_${searchTerm}_${startIndex}_${endIndex}`;
	const cachedData = await getCacheData(cacheKey);
	if (!cacheEnabled || !cachedData) {
		let query = supabase.from(DATABASE_TABLE_VIEW.inventory_items_view).select(
			`
            *,
            category:categories(*),
            purchase_order_items:purchase_order_items(*),
            sales_order_items:sales_order_items(*),
            item_variants:inventory_item_variants(
            *,
            variant:variants(*)
            )
            `,
			{ count: "exact", head: false },
		);

		if (selectedStatus !== ALL_OPTIONS) {
			query = query.eq("status", selectedStatus);
		}
		if (selectedCategoryId !== ALL_OPTIONS) {
			query = query.eq("category_id", selectedCategoryId);
		}
		if (selectedStockLevel !== ALL_OPTIONS) {
			switch (selectedStockLevel) {
				case StockLevel.IN_STOCK:
					query = query.eq("is_in_stock", true);
					break;
				case StockLevel.OUT_STOCK:
					query = query.eq("quantity", 0);
					break;
				case StockLevel.LOW_STOCK:
					query = query.eq("is_low_stock", true);
					break;
				default:
					console.log("Invalid stock level choice", selectedStockLevel);
					break;
			}
		}
		if (searchTerm) {
			query = query.or(`name.ilike.%${searchTerm}%, sku.ilike.%${searchTerm}%`);
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

export async function fetchInventoryItemOptions(
	tenantId: string,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const cacheKey = `${RedisCacheKey.inventory_items}_${tenantId}`;
	const cachedData = await getCacheData(cacheKey);
	if (!cachedData || cachedData.data?.length === 0) {
		const { data, count, error } = await supabase
			.from(DATABASE_TABLE.inventory_items)
			.select(
				`id, sku, name, unit_price, quantity,
                item_variants:inventory_item_variants(
                    *,
                    variant:variants(*)
                )`,
				{ count: "exact", head: false },
			)
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

export async function saveInventoryItem(
	requestData: InventoryItemData,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc(
		RPC_FUNCTION.TRANSACTION_INVENTORY_ITEM_HANDLER,
		requestData,
	);

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.inventory_items}_${data[0].tenant_id}`;
		await deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}

export async function updateInventoryItem(
	requestData: InventoryItemData,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc(
		RPC_FUNCTION.TRANSACTION_INVENTORY_ITEM_HANDLER,
		requestData,
	);

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.inventory_items}_${data[0].tenant_id}`;
		await deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}

export async function updateInventoryItemRecordStatus(
	id: string,
	requestData: StatusPayload,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.inventory_items)
		.update(requestData)
		.eq("id", id)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.inventory_items}_${data[0].tenant_id}`;
		await deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}
