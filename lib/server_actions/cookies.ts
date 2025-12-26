"use server";

import { cookies } from "next/headers";
import { CONSENT_COOKIE_KEY } from "../Constants";
import { ConsentCookieStatus } from "../Enums";

// --- GDPR POPUP LOGIC ---

/**
 * Sets the client-accessible consent cookie.
 */
export async function setConsentCookie(value) {
	/*
    let expires = "";
    const date = new Date();
    date.setTime(
        date.getTime() + ConsentCookieStatus.expireAfterDays * 24 * 60 * 60 * 1000,
    );
    expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${CONSENT_COOKIE_KEY}=${value || ""}${expires}; path=/; secure; samesite=Lax`;
    */
	(await cookies()).set(CONSENT_COOKIE_KEY, value || "", {
		expires: parseInt(ConsentCookieStatus.expireAfterDays.toString(), 10),
		sameSite: "lax",
		path: "/",
	});
}
