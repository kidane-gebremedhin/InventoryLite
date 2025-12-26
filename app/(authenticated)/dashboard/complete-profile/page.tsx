"use client";

import type { PostgrestError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLoadingContext } from "@/components/context_apis/LoadingProvider";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { VALIDATION_ERRORS_MAPPING } from "@/lib/Constants";
import { ROUTE_PATH } from "@/lib/Enums";
import {
	showErrorToast,
	showServerErrorToast,
	showSuccessToast,
} from "@/lib/helpers/Helper";
import { fetchDomainOptions } from "@/lib/server_actions/domain";
import {
	clearSubscriptionInfoCookies,
	clearUserSubscriptionInfo,
	updateUserSubscriptionInfo,
} from "@/lib/server_actions/user";
import type { UserSubscriptionInfo } from "@/lib/types/Models";

export default function CompleteProfile() {
	const [domains, setDomains] = useState([]);

	const router = useRouter();
	const { setLoading } = useLoadingContext();
	const { currentUser } = useAuthContext();

	const [formData, setFormData] = useState<Partial<UserSubscriptionInfo>>({
		name: "",
		domain_id: "",
		price_id: "",
		current_payment_expiry_date: null,
		expected_payment_amount: 0,
	});

	useEffect(() => {
		const initialData: Partial<UserSubscriptionInfo> = {
			name: currentUser?.subscriptionInfo?.name.split("@")[0],
			domain_id: currentUser?.subscriptionInfo?.domain_id || "",
			price_id: currentUser?.subscriptionInfo?.price_id || "",
			current_payment_expiry_date:
				currentUser?.subscriptionInfo?.current_payment_expiry_date,
			expected_payment_amount:
				currentUser?.subscriptionInfo?.expected_payment_amount,
		};
		setFormData(initialData);
	}, [currentUser]);

	useEffect(() => {
		const loadDomains = async () => {
			try {
				setLoading(true);
				const { data, error } = await fetchDomainOptions(
					currentUser?.subscriptionInfo?.tenant_id,
				);

				if (error) {
					showServerErrorToast(error.message);
				}

				setDomains(data || []);
			} catch (_error) {
				showErrorToast();
			} finally {
				setLoading(false);
			}
		};

		loadDomains();
	}, [currentUser?.subscriptionInfo?.tenant_id, setLoading]);

	const updateProfile = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.domain_id || !formData.name) {
			showErrorToast("Please fill in all required fields.");
			return;
		}

		const userSubscriptionInfo: Partial<UserSubscriptionInfo> = {
			domain_id: formData.domain_id,
			name: formData.name,
			description: formData.description || "",
			price_id: formData.price_id || "123",
			expected_payment_amount: formData.expected_payment_amount || 0,
			profile_complete: true,
		};

		try {
			const { error } = await updateUserSubscriptionInfo(
				currentUser.email,
				userSubscriptionInfo,
			);

			if (error) {
				handleServerError(error.message);
				return;
			}

			// Reset the user subscription info cache and cookies on profile completion
			await clearUserSubscriptionInfo(currentUser);
			await clearSubscriptionInfoCookies();

			showSuccessToast("Profile updated.");
			router.push(ROUTE_PATH.DASHBOARD);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (field: keyof UserSubscriptionInfo, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleServerError = (error: PostgrestError) => {
		if (error.message.includes(VALIDATION_ERRORS_MAPPING.serverError)) {
			showErrorToast(
				VALIDATION_ERRORS_MAPPING.entities.userSubscriptionInfo.fields.name
					.displayError,
			);
		} else {
			showServerErrorToast(error.message);
		}
	};

	return (
		<div className="w-full items-center">
			<div className="w-full md:w-1/2">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-semibold text-gray-900 py-4">
						Complete your profile
					</h2>
				</div>

				<form onSubmit={updateProfile} className="space-y-4">
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							What is your business industry?
						</span>
						<select
							value={formData.domain_id}
							onChange={(e) => handleInputChange("domain_id", e.target.value)}
							className="input-field"
							required
						>
							<option value="">Select business industry</option>
							{domains.map((domain) => (
								<option key={domain.id} value={domain.id}>
									{domain.name}
								</option>
							))}
						</select>
					</div>
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Company Name *
						</span>
						<input
							type="text"
							value={formData.name ?? ""}
							onChange={(e) => handleInputChange("name", e.target.value)}
							className="input-field"
							required
						/>
					</div>

					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Description
						</span>
						<textarea
							value={formData.description ?? ""}
							onChange={(e) => handleInputChange("description", e.target.value)}
							className="input-field"
							rows={3}
						/>
					</div>

					<div className="flex justify-end space-x-3 pt-4">
						<div className="w-full pl-6 flex justify items-center">
							<button type="submit" className="btn-outline-primary">
								Save Profile
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
