"use client";

import Link from "next/link";
import { APP_NAME } from "@/lib/app_config/config";
import { ROUTE_PATH } from "@/lib/Enums";

export default function Navbar() {
	return (
		<div>
			<nav className="bg-white shadow-sm py-4">
				<div className="container mx-auto px-4 md:flex md:justify-between md:items-center">
					<Link href="/" className="flex items-center space-x-2">
						<span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
					</Link>
					<div className="flex items-center">
						<div className="space-x-4">
							<Link
								href={ROUTE_PATH.PRODUCT_DEMO}
								className="text-gray-600 hover:text-teal-600"
							>
								Demo
							</Link>
							<Link href={ROUTE_PATH.PRICING_PLAN}>Pricing</Link>
							<a
								href="http://ethiotechsolutions.com"
								className="text-gray-600 hover:text-teal-600"
							>
								Contact
							</a>
						</div>
						<Link
							href={ROUTE_PATH.SIGNIN}
							className="ml-auto md:ml-4 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 transition-all duration-200"
						>
							Sign In
						</Link>
					</div>
				</div>
			</nav>
		</div>
	);
}
