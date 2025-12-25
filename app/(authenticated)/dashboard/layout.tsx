"use client";

import { useLoadingContext } from "@/components/context_apis/LoadingProvider";
import LoadingOverlay from "@/components/helpers/LoadingOverlay";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { loading } = useLoadingContext();

	return (
		<div className="min-h-screen bg-gray-50">
			<Sidebar />
			<div className="lg:pl-64">
				<Header />
				<LoadingOverlay loading={loading} />
				<main className="py-6">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8  mt-16">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
