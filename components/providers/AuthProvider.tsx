"use client";

import { usePathname, useRouter } from "next/navigation";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	CookiesKey,
	DATABASE_TABLE,
	RedisCacheKey,
	ROUTE_PATH,
} from "@/lib/Enums";
import { deleteCacheByKeyPrefix } from "@/lib/server_actions/redis";
import {
	clearUserCache,
	clearUserCookieByKey,
	clearUserCookies,
	fetchUserProfile,
} from "@/lib/server_actions/user";
import type { User } from "@/lib/types/Models";
import { createClient } from "@/supabase/client";

type AuthContextType = {
	supabase: ReturnType<typeof createClient>;
	currentUser: User | null;
	loading: boolean;
	signOut: () => Promise<void>;
	signInWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [currentUser, setCurrentUser] = useState<User>(null);
	const [loading] = useState(true);
	const router = useRouter();
	const pathName = usePathname();

	const supabase = createClient();

	const handleTenantSubscriptionInfoUpdate = useCallback(async () => {
		if (pathName === ROUTE_PATH.TENANT) {
			// No need to redirect to dashbord
			return;
		}

		const cacheKey = `${RedisCacheKey.user_subscription_info}_${currentUser?.id}`;
		await deleteCacheByKeyPrefix(cacheKey);
		await clearUserCookieByKey(RedisCacheKey.manual_payments);
		await clearUserCookieByKey(CookiesKey.ucookiesinfo);
		router.push(ROUTE_PATH.DASHBOARD);
	}, [currentUser, router, pathName]);

	useEffect(() => {
		// 1. Get initial session on page reload
		supabase.auth.getSession().then(async ({ data }) => {
			fetchUserProfile(data?.session?.user, true).then((currentUser) => {
				setCurrentUser(currentUser);
			});
		});

		// 2. LISTEN to changes (login, logout, token refresh, OAuth redirect)
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, newSession) => {
			fetchUserProfile(newSession?.user, true).then((currentUser) => {
				setCurrentUser(currentUser);
			});
		});

		// Unsubscribe when the component unmounts
		return () => subscription.unsubscribe();
	}, [supabase.auth]);

	useEffect(() => {
		const channel = supabase.channel("tenant-updates-listener");

		channel.on(
			"postgres_changes",
			{ event: "*", schema: "public", table: DATABASE_TABLE.tenants },
			() => handleTenantSubscriptionInfoUpdate(),
		);
		channel.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: DATABASE_TABLE.user_tenant_mappings,
			},
			() => handleTenantSubscriptionInfoUpdate(),
		);

		channel.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [supabase, handleTenantSubscriptionInfoUpdate]);

	const signOut = async () => {
		await clearUserCache(currentUser);
		await clearUserCookies();
		// This should be below cookie clearance
		await supabase.auth.signOut();
		router.push(ROUTE_PATH.SIGNIN);
	};

	const signInWithGoogle = async () => {
		await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${location.origin}${ROUTE_PATH.OAUTH_GOOGLE_WEBHOOK}`,
			},
		});
	};

	const value = {
		supabase,
		currentUser,
		loading,
		signOut,
		signInWithGoogle,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
	return useContext(AuthContext);
}
