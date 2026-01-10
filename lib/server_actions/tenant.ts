"use server";

import { createClient } from "@/supabase/server";
import { ALL_OPTIONS } from "../Constants";
import { DATABASE_TABLE, RecordStatus } from "../Enums";
import type { ServerActionsResponse, StatusPayload } from "../types/Models";

interface SearchParams {
	selectedStatus: string;
	searchTerm: string;
	startIndex: number;
	endIndex: number;
}

export async function fetchTenants({
	selectedStatus,
	searchTerm,
	startIndex,
	endIndex,
}: SearchParams): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	let query = supabase.from(DATABASE_TABLE.tenants).select(
		`*, 
			affiliate_partner:affiliate_partners(*),
			subscription_plan:subscription_plans(*),
			domain:domains(*)
		`,
		{ count: "exact", head: false },
	);
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

	return { data, count, error };
}

export async function fetchTenantOptions(): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, count, error } = await supabase
		.from(DATABASE_TABLE.tenants)
		.select("id, name", { count: "exact", head: false })
		.eq("status", RecordStatus.ACTIVE)
		.order("name", { ascending: true });

	return { data, count, error };
}

export async function updateTenantAffiliatePartner(
	id: string,
	affiliate_partner_id: string,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.tenants)
		.update({ affiliate_partner_id: affiliate_partner_id })
		.eq("id", id)
		.select();

	return { data, error };
}

export async function updateTenantRecordStatus(
	id: string,
	requestData: StatusPayload,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.tenants)
		.update(requestData)
		.eq("id", id)
		.select();

	return { data, error };
}
