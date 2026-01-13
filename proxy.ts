import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
	ADMIN_PATHS,
	CACHE_TTL_USER_SUBSCRIPTION_INFO,
	PUBLIC_PATHS,
} from "./lib/Constants";
import {
	ConsentCookieStatus,
	CookiesKey,
	RecordStatus,
	ROUTE_PATH,
	SubscriptionStatus,
	UserRole,
} from "./lib/Enums";
import { fetchUserProfile } from "./lib/server_actions/user";

export async function proxy(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	let user = null;
	const userSubscriptionInfo = request.cookies.get(
		CookiesKey.ucookiesinfo,
	)?.value;
	const cookiesExist = request.cookies
		.getAll()
		.find((cookie) => cookie.name.includes("sb-"));
	// Reauthenticate when not sufficient cookies
	if (!userSubscriptionInfo || !cookiesExist) {
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
			{
				cookies: {
					getAll() {
						return request.cookies.getAll();
					},
					setAll(cookiesToSet) {
						cookiesToSet.forEach(({ name, value }) => {
							request.cookies.set(name, value);
						});
						supabaseResponse = NextResponse.next({
							request,
						});
						cookiesToSet.forEach(({ name, value, options }) => {
							supabaseResponse.cookies.set(name, value, options);
						});
					},
				},
			},
		);

		const { data } = await supabase.auth.getUser();
		if (data) {
			user = await fetchUserProfile(data.user);
			supabaseResponse.cookies.set({
				name: CookiesKey.ucookiesinfo,
				value: JSON.stringify(user),
				httpOnly: true,
				secure: true,
				sameSite: "strict",
				path: "/",
				maxAge: CACHE_TTL_USER_SUBSCRIPTION_INFO,
			});

			console.log("User details From DB");
		}
	} else {
		user = JSON.parse(userSubscriptionInfo);
		console.log("User details From Cookies");
	}

	// Redirect unauthenticated users to login page except for public ones
	if (!PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
		if (!user) {
			return NextResponse.redirect(new URL(ROUTE_PATH.SIGNIN, request.url));
		}

		// Block requests if cookies not enabled
		const cookiesEnabled =
			request.cookies.get(CookiesKey.gdpr_consent)?.value ===
			ConsentCookieStatus.accepted.toString();
		if (
			!cookiesEnabled &&
			request.nextUrl.pathname !== ROUTE_PATH.ENABLE_COOKIES &&
			(user?.subscriptionInfo?.profile_complete ||
				user?.subscriptionInfo?.role === UserRole.SUPER_ADMIN)
		) {
			return NextResponse.redirect(
				new URL(ROUTE_PATH.ENABLE_COOKIES, request.url),
			);
		}

		// Redirect tenant admins to complete profile
		if (
			user?.subscriptionInfo?.role === UserRole.TENANT_ADMIN &&
			!user?.subscriptionInfo?.profile_complete &&
			request.nextUrl.pathname !== ROUTE_PATH.COMPLETE_PROFILE
		) {
			return NextResponse.redirect(
				new URL(ROUTE_PATH.COMPLETE_PROFILE, request.url),
			);
		}
		// Redirect deactivated users to error page
		if (
			user?.subscriptionInfo?.profile_complete &&
			user?.subscriptionInfo?.status !== RecordStatus.ACTIVE &&
			request.nextUrl.pathname !== ROUTE_PATH.DEACTIVATED_ACCOUNT
		) {
			return NextResponse.redirect(
				new URL(ROUTE_PATH.DEACTIVATED_ACCOUNT, request.url),
			);
		}

		if (
			user?.subscriptionInfo?.profile_complete &&
			request.nextUrl.pathname === ROUTE_PATH.COMPLETE_PROFILE
		) {
			return NextResponse.redirect(new URL(ROUTE_PATH.DASHBOARD, request.url));
		}
		// Restrict SUPER_ADMIN pages
		if (
			user?.subscriptionInfo?.role !== UserRole.SUPER_ADMIN &&
			ADMIN_PATHS.includes(request.nextUrl.pathname)
		) {
			return NextResponse.redirect(new URL(ROUTE_PATH.DASHBOARD, request.url));
		}

		// Redirect to payment page when expired
		if (
			user?.subscriptionInfo?.role !== UserRole.SUPER_ADMIN &&
			user?.subscriptionInfo?.subscription_status ===
				SubscriptionStatus.EXPIRED &&
			request.nextUrl.pathname !== ROUTE_PATH.MANUAL_PAYMENT
		) {
			return NextResponse.redirect(
				new URL(ROUTE_PATH.MANUAL_PAYMENT, request.url),
			);
		}
	} else {
		// Redirect authenticated users to dashboard from landing page
		if (user) {
			return NextResponse.redirect(new URL(ROUTE_PATH.DASHBOARD, request.url));
		}
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - images (public images)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|images|api|mobile_apps|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
