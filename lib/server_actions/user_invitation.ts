"use server";

import crypto from "node:crypto";
import { createClient } from "@/supabase/server";
import { ALL_OPTIONS, USER_INVITATION_EXPIRY_HOURS } from "../Constants";
import { DATABASE_TABLE, RedisCacheKey, ROUTE_PATH } from "../Enums";
import { convertToUTC } from "../helpers/Helper";
import type {
	ServerActionsResponse,
	StatusPayload,
	UserInvitation,
} from "../types/Models";
import { sendMail } from "./mail";
import { deleteCacheByKeyPrefix, getCacheData, setCacheData } from "./redis";

interface SearchParams {
	tenantId: string;
	selectedStatus: string;
	searchTerm: string;
	startIndex: number;
	endIndex: number;
}

export async function fetchUserInvitations({
	tenantId,
	selectedStatus,
	searchTerm,
	startIndex,
	endIndex,
}: SearchParams): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const cacheKey = `${RedisCacheKey.tenant_user_invites}_${tenantId}_${selectedStatus}_${searchTerm}_${startIndex}_${endIndex}`;
	const cachedData = await getCacheData(cacheKey);
	if (!cachedData || cachedData.data?.length === 0) {
		let query = supabase
			.from(DATABASE_TABLE.tenant_user_invites)
			.select("*", { count: "exact", head: false });
		if (selectedStatus !== ALL_OPTIONS) {
			query = query.eq("status", selectedStatus);
		}
		if (searchTerm) {
			query = query.or(`email.ilike.%${searchTerm}%`);
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

export async function saveUserInvitation(
	tenantName: string,
	requestData: Partial<UserInvitation>,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	// Generates a secure, 64-character token
	const token = crypto.randomBytes(32).toString("hex");
	const expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours() + USER_INVITATION_EXPIRY_HOURS);
	const invitationLink = `${process.env.APP_URL}${ROUTE_PATH.SIGNIN}?token=${token}`;
	const invitationExpiresAt = convertToUTC(expiresAt).toUTCString();

	requestData = {
		...requestData,
		...{
			token: token,
			expires_at: invitationExpiresAt,
		},
	};
	const { data, error } = await supabase
		.from(DATABASE_TABLE.tenant_user_invites)
		.insert(requestData)
		.select();

	if (!error) {
		const { data: _, error: emailError } = await sendMail({
			email: requestData.email,
			tenantName,
			invitationLink,
			invitationExpiresAt,
		});
		if (emailError) {
			console.log(`Failed to send invitation email to ${requestData.email}`);
		}
	}

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.tenant_user_invites}_${data[0].tenant_id}`;
		await deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}

export async function updateUserInvitation(
	id: string,
	requestData: Partial<UserInvitation>,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.tenant_user_invites)
		.update(requestData)
		.eq("id", id)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.tenant_user_invites}_${data[0].tenant_id}`;
		await deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}

export async function updateUserInvitationStatus(
	id: string,
	requestData: StatusPayload,
): Promise<ServerActionsResponse> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from(DATABASE_TABLE.tenant_user_invites)
		.update(requestData)
		.eq("id", id)
		.select();

	if (data && data.length > 0) {
		const cacheKey = `${RedisCacheKey.tenant_user_invites}_${data[0].tenant_id}`;
		await deleteCacheByKeyPrefix(cacheKey);
	}
	return { data, error };
}
