import { createServerClient } from "@supabase/ssr";
import { createClient as createClientForServiceRole } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const createClient = async () => {
	const cookieStore = await cookies();

	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) => {
						cookieStore.set(name, value, options);
					});
				},
			},
		},
	);
};

// Use this with Caution, only use it for power actions
export const createServerClientWithServiceKey = () => {
	return createClientForServiceRole(
		process.env.NEXT_PUBLIC_SUPABASE_URL,
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YnhndnpzdmpsZ3Z2ZGhka3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDg3NCwiZXhwIjoyMDcwNjAwODc0fQ.mzJvy_RW_hoUaPoXV7AOzG8Jb8pg1_OzktmfeS0wVH8",
	);
};
