"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTE_PATH } from "@/lib/Enums";
import { acceptCookies, consentGiven } from "@/lib/helpers/Helper";
import { useLoadingContext } from "../context_apis/LoadingProvider";
import { useAuthContext } from "../providers/AuthProvider";

export default function CookiesConsent() {
	const [consent, setConsent] = useState(null);
	const router = useRouter();
	const { setLoading } = useLoadingContext();
	const { currentUser } = useAuthContext();

	useEffect(() => {
		setConsent(consentGiven());
	}, []);

	return (
		<>
			<style>
				{`#consent-modal {
                    transition: all 0.3s ease-in-out;
                }`}
			</style>
			{/* The actual GDPR Consent Modal (fixed to the bottom) */}
			{!consent && (
				<div
					id="consent-modal"
					className="fixed inset-x-0 bottom-0 z-50 p-4 transform translate-y-0 opacity-100 pointer-events-auto"
				>
					<div className="max-w-4xl mx-auto bg-gray-900 text-white p-6 rounded-xl shadow-2xl flex flex-col md:flex-row items-center justify-between">
						<div className="flex-grow mb-4 md:mb-0">
							<p className="text-lg font-semibold mb-1">
								We value your privacy
							</p>
							<p className="text-sm text-gray-300">
								We use cookies to store the necessary HTTP-only session and auth
								cookies needed for core functionality of this system. By
								clicking "Accept", you consent to our use of these cookies.
							</p>
						</div>
						<div className="flex-shrink-0">
							<button
								type="button"
								id="accept-button"
								onClick={async () => {
									await acceptCookies();
									setConsent(true);
									setLoading(true);
									if (currentUser?.subscriptionInfo?.profile_complete) {
										router.push(ROUTE_PATH.DASHBOARD);
									}
								}}
								className="px-6 py-3 bg-green-500 text-gray-900 font-bold rounded-lg hover:bg-green-600 transition duration-150 shadow-lg whitespace-nowrap"
							>
								Accept All Cookies
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
