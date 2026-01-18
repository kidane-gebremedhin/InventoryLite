"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTE_PATH } from "@/lib/Enums";

interface ErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

// Rename the function from 'Error' to 'RootError' or 'ErrorBoundary'
export default function RootError({ error, reset }: ErrorProps) {
	const router = useRouter();
	useEffect(() => {
		console.error(error);
	}, [error]);

	const handleErrorResolution = () => {
		reset();
		router.push(ROUTE_PATH.DASHBOARD);
	};

	return (
		<div className="flex justify-center items-center h-80">
			<div className="w-full text-center">
				<h2 className="font-bold text-xl p-2">Oops, Something went wrong!</h2>
				<button
					type="button"
					onClick={handleErrorResolution}
					className="w-3/4 py-2 px-4 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors"
				>
					Go to Dashboard
				</button>
			</div>
		</div>
	);
}
