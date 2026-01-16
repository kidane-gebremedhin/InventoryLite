import "./../globals.css";
import { Toaster } from "react-hot-toast";
import { LoadingProvider } from "@/components/context_apis/LoadingProvider";

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<div className="min-h-screen bg-gray-50 font-sans text-gray-800 antialiased">
				<div className="pb-8">
					<LoadingProvider>{children}</LoadingProvider>
				</div>
			</div>
			<Toaster position="top-right" />
		</>
	);
}
