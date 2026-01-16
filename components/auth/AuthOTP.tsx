"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTE_PATH } from "@/lib/Enums";
import { useAuthContext } from "../providers/AuthProvider";

enum AuthStep {
	EMAIL = "email",
	OTP = "otp",
}

export default function EmailOtpLogin() {
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [label, setLabel] = useState("");
	const [step, setStep] = useState<AuthStep.EMAIL | AuthStep.OTP>(
		AuthStep.EMAIL,
	);

	const router = useRouter();
	const { supabase } = useAuthContext();

	const sendOtp = async () => {
		setLoading(true);
		const { error } = await supabase.auth.signInWithOtp({ email });
		if (!error) {
			setStep(AuthStep.OTP);
		} else {
			setLabel("Invalid Email");
		}
		setLoading(false);
	};

	const verifyOtp = async () => {
		setLoading(true);
		const { error } = await supabase.auth.verifyOtp({
			email,
			token: otp,
			type: "email",
		});

		setLoading(false);
		setOtp("");
		if (!error) {
			setLabel("Verification Success!");
			router.push(ROUTE_PATH.DASHBOARD);
		} else {
			setLabel("Verification Failed!");
		}
	};

	return (
		<div className="text-gray-600">
			<span className="text-2xl font-bold text-gray-500 flex justify-center pb-3">
				Signin with your Email
			</span>
			{step === AuthStep.EMAIL ? (
				<div className="w-full">
					<div className="w-full p-1">
						<input
							className="input-field"
							value={email}
							autoFocus
							required
							placeholder="youremail@example.com"
							style={{ cursor: loading ? "not-allowed" : "pointer" }}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
					<div className="w-full p-1">
						<button
							type="submit"
							className={`w-full ${loading || !email ? "btn-outline-default" : "btn-outline-primary"}`}
							disabled={loading || !email}
							style={{ cursor: loading ? "not-allowed" : "pointer" }}
							onClick={sendOtp}
						>
							{loading ? "Signing In..." : label || "Sign In"}
						</button>
					</div>
				</div>
			) : (
				<div className="w-full text-center">
					<p className="pb-2">
						We have sent OTP to: <strong>{email}</strong>
					</p>
					<div className="w-full p-1">
						<input
							className="input-field"
							value={otp}
							autoFocus
							required
							placeholder="Enter OTP"
							style={{ cursor: loading ? "not-allowed" : "pointer" }}
							onChange={(e) => setOtp(e.target.value)}
						/>
					</div>
					<div className="w-full p-1">
						<button
							type="submit"
							className={`w-full ${loading || !otp ? "btn-outline-default" : "btn-outline-primary"}`}
							disabled={loading || !otp}
							style={{ cursor: loading ? "not-allowed" : "pointer" }}
							onClick={verifyOtp}
						>
							{loading ? "Sending..." : label || "Verify OTP"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
