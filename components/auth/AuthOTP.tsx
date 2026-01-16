"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTE_PATH } from "@/lib/Enums";
import { useAuthContext } from "../providers/AuthProvider";

export default function EmailOtpLogin() {
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [step, setStep] = useState<"email" | "otp">("email");

	const router = useRouter();
	const { supabase } = useAuthContext();

	const sendOtp = async () => {
		const { error } = await supabase.auth.signInWithOtp({ email });
		if (!error) setStep("otp");
	};

	const verifyOtp = async () => {
		const { error } = await supabase.auth.verifyOtp({
			email,
			token: otp,
			type: "email",
		});

		if (!error) {
			router.push(ROUTE_PATH.DASHBOARD);
		}
	};

	return (
		<div className="text-gray-600">
			{step === "email" ? (
				<>
					<input
						placeholder="youremail@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<button type="submit" onClick={sendOtp}>
						Send OTP
					</button>
				</>
			) : (
				<>
					<input
						placeholder="Enter OTP"
						value={otp}
						onChange={(e) => setOtp(e.target.value)}
					/>
					<button type="submit" onClick={verifyOtp}>
						Verify
					</button>
				</>
			)}
		</div>
	);
}
