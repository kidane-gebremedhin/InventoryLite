"use client";

import Image from "next/image";
import { useAuthContext } from "../providers/AuthProvider";

export function Auth() {
	const { signInWithGoogle } = useAuthContext();
	const googleSSOImage = "/images/auth_providers/google/google-sso-1.JPG";

	return (
		<div className="space-y-3">
			<div className="text-center">
				<p className="font-bold text-gray-400 mt-3">Or</p>
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
			</div>
		</div>
	);
}
