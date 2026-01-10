"use client";

import { Auth } from "@/components/auth/Auth";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function HomePage() {
	return (
		<div className="h-[420px] md:h-[700px] bg-gradient-to-tr from-green-500 to-teal-500 py-6 md:py-16 text-white">
			<div className="container mx-auto px-4 md:py-14">
				<div className="max-w-md mx-auto">
					<div className="text-center mb-8">
						<h1 className="text-2xl font-bold">
							Demand and Inventory Management Simplified!
						</h1>
						<span>Built for small and growing businesses</span>
					</div>

					<div className="card">
						<AuthProvider>
							<Auth />
						</AuthProvider>
					</div>
				</div>
			</div>
		</div>
	);
}
