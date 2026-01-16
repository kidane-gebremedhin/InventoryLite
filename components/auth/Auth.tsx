"use client";

import Image from "next/image";
import Link from "next/link";
import { ROUTE_PATH } from "@/lib/Enums";
import { useAuthContext } from "../providers/AuthProvider";

export function Auth() {
	const { signInWithGoogle } = useAuthContext();
	const googleSSOImage = "/images/auth_providers/google/google-sso-1.JPG";

	return (
		<div className="space-y-6">
			<div className="text-center">
				<p className="text-gray-600 mt-2">Signin with your Google account.</p>
			</div>

			<div className="space-y-4">
				{/* Google Sign-In Button */}
				<div className="w-full">
					<button
						type="button"
						onClick={signInWithGoogle}
						className="flex justify-center text-gray-600 py-2 px-8"
					>
						<Image
							src={googleSSOImage}
							width={400}
							height={50}
							alt="Continue with Google"
							className="rounded-lg shadow-lg"
							unoptimized
						/>
					</button>
				</div>

				<div className="text-center">
					<p className="text-xs text-gray-500">
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
	);
}
