"use client";

import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/app_config/config";
import { getCurrentDateTime } from "@/lib/helpers/Helper";
import { LoadingProvider } from "../context_apis/LoadingProvider";
import CookiesConsent from "../helpers/CookiesConsent";
import MiniLoading from "../helpers/MiniLoading";

export default function Footer() {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	});

	if (!isMounted) return <MiniLoading />;

	return (
		<footer className="bg-gray-800 text-gray-300 py-8">
			<div className="container mx-auto px-4 text-center text-sm">
				<p>
					&copy; {getCurrentDateTime().getFullYear()} {APP_NAME}. All rights
					reserved.
				</p>
				<div className="mt-2 space-x-4">
					<a href="http://ethiotechsolutions.com" className="hover:text-white">
						Privacy Policy
					</a>
					<a href="http://ethiotechsolutions.com" className="hover:text-white">
						Terms of Service
					</a>
					<a href="http://ethiotechsolutions.com" className="hover:text-white">
						Support
					</a>
				</div>
			</div>
			<LoadingProvider>
				<CookiesConsent />
			</LoadingProvider>
		</footer>
	);
}
