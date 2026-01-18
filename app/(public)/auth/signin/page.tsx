"use client";

import Link from "next/link";
import { Auth } from "@/components/auth/Auth";
import AuthOTP from "@/components/auth/AuthOTP";
import { ROUTE_PATH } from "@/lib/Enums";

export default function HomePage() {
	return (
		<div className="h-[420px] h-[700px] bg-gradient-to-tr from-green-500 to-teal-500 py-6 md:py-16 text-white">
			<div className="container mx-auto px-4">
				<div className="max-w-md mx-auto">
					<div className="text-center mb-8">
						<h1 className="text-2xl font-bold">
							Simple Demand and Inventory Management Software
						</h1>
						<p className="pt-1">Built for modern growing businesses</p>
					</div>

					<div className="card">
						<AuthOTP />
						<div className="hidden md:block">
							<Auth />
						</div>

						<div className="text-center">
							<p className="text-xs text-gray-500 p-4">
								By signing in, you agree to the{" "}
								<Link
									target="_blank"
									href={ROUTE_PATH.TERMS_OF_SERVICE}
									className="text-blue-600"
								>
									<u>
										<small>Terms of Service</small>
									</u>
								</Link>{" "}
								and{" "}
								<Link
									target="_blank"
									href={ROUTE_PATH.PRIVACY_POLICY}
									className="text-blue-600"
								>
									<u>
										<small>Privacy Policy</small>
									</u>
								</Link>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
