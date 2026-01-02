"use client";

import Link from "next/link";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/app_config/config";
import { ROUTE_PATH } from "@/lib/Enums";
import { getCurrentDateTime } from "@/lib/helpers/Helper";
import { LoadingProvider } from "../context_apis/LoadingProvider";
import CookiesConsent from "../helpers/CookiesConsent";

export default function Footer() {
	return (
		<footer className="bg-gray-800 text-gray-300 py-8">
			<div className="container mx-auto px-4 text-center text-sm">
				<p>
					&copy; {getCurrentDateTime().getFullYear()} {APP_NAME}. All rights
					reserved | Contact us {CONTACT_EMAIL}
				</p>
				<div className="mt-2 space-x-4">
					<Link
						className="hover:text-white"
						href={ROUTE_PATH.TERMS_OF_SERVICE}
						target="_blank"
					>
						Terms of Service
					</Link>
					<Link
						className="hover:text-white"
						href={ROUTE_PATH.PRIVACY_POLICY}
						target="_blank"
					>
						Privacy Policy
					</Link>
					<Link className="hover:text-white" href={ROUTE_PATH.LANDING_PAGE}>
						Home
					</Link>
				</div>
			</div>
			<LoadingProvider>
				<CookiesConsent />
			</LoadingProvider>
		</footer>
	);
}
