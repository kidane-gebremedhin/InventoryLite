"use server";

import { cookies } from "next/headers";
import { ConsentCookieStatus, CookiesKey } from "../Enums";

// --- GDPR POPUP LOGIC ---

/**
 * Sets the client-accessible consent cookie.
 */
export async function setConsentCookie(value) {
	const cookieStore = await cookies();

	cookieStore.set(CookiesKey.gdpr_consent, value, {
		path: "/",
		maxAge: 60 * 60 * 24 * ConsentCookieStatus.expireAfterDays,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
	});
}
