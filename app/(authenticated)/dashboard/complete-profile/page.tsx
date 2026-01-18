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
import { fetchSubscriptionPlanOptions } from "@/lib/server_actions/subscription_plan";
import {
	clearSubscriptionInfoCookies,
	clearUserSubscriptionInfo,
	updateUserSubscriptionInfo,
} from "@/lib/server_actions/user";
import type { UserSubscriptionInfo } from "@/lib/types/Models";

export default function CompleteProfile() {
	const [domains, setDomains] = useState([]);
	const [subscriptionPlans, setSubscriptionPlans] = useState([]);

	const router = useRouter();
	const { setLoading } = useLoadingContext();
	const { currentUser } = useAuthContext();

	const [formData, setFormData] = useState<Partial<UserSubscriptionInfo>>({
		name: "",
		domain_id: "",
		subscription_plan_id: "",
		price_id: "",
		current_payment_expiry_date: null,
	});

	useEffect(() => {
		const initialData: Partial<UserSubscriptionInfo> = {
			name: "",
			domain_id: currentUser?.subscriptionInfo?.domain_id || "",
			subscription_plan_id:
				currentUser?.subscriptionInfo?.subscription_plan_id || "",
			price_id: currentUser?.subscriptionInfo?.price_id || "",
			current_payment_expiry_date:
				currentUser?.subscriptionInfo?.current_payment_expiry_date,
		};
		setFormData(initialData);
	}, [currentUser]);

	useEffect(() => {
		const loadDomains = async () => {
			try {
				setLoading(true);
				const { data, error } = await fetchDomainOptions();

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
	}, [setLoading]);

	useEffect(() => {
		const loadSubscriptionPlans = async () => {
			try {
				setLoading(true);
				const { data, error } = await fetchSubscriptionPlanOptions();

				if (error) {
					showServerErrorToast(error.message);
				}

				setSubscriptionPlans(data || []);
			} catch (_error) {
				showErrorToast();
			} finally {
				setLoading(false);
			}
		};

		loadSubscriptionPlans();
	}, [setLoading]);

	const updateProfile = async (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!formData.domain_id ||
			!formData.name ||
			!formData.subscription_plan_id
		) {
			showErrorToast("Please fill in all required fields.");
			return;
		}

		const userSubscriptionInfo: Partial<UserSubscriptionInfo> = {
			domain_id: formData.domain_id,
			subscription_plan_id: formData.subscription_plan_id,
			name: formData.name,
			description: formData.description || "",
			price_id: formData.price_id || "NA",
			profile_complete: true,
		};

		try {
			const { error } = await updateUserSubscriptionInfo(
				currentUser.email,
				userSubscriptionInfo,
			);

			if (error) {
				handleServerError(error);
				return;
			}

			// Reset the user subscription info cache and cookies on profile completion
			await clearUserSubscriptionInfo(currentUser);
			await clearSubscriptionInfoCookies();

			showSuccessToast("Profile updated.");
			router.push(ROUTE_PATH.DASHBOARD);
		} catch (error) {
			console.log("Profile updated error", error);
			//showErrorToast();
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
							What is your business domain(industry)?
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
							Your company Name *
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
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Choose Payment Plan
						</span>
						<select
							value={formData.subscription_plan_id}
							onChange={(e) =>
								handleInputChange("subscription_plan_id", e.target.value)
							}
							className="input-field"
							required
						>
							<option value="">Select payment plan</option>
							{subscriptionPlans.map((subscription_plan) => (
								<option key={subscription_plan.id} value={subscription_plan.id}>
									{`${subscription_plan.subscription_tier}(${subscription_plan.billing_cycle}) ${subscription_plan.currency_type}${subscription_plan.payment_amount}`}
								</option>
							))}
						</select>
					</div>
					<div className="flex justify-end space-x-3 pt-4">
						<div className="w-full flex justify items-center">
							<button type="submit" className="btn-outline-primary">
								Update Account Profile
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
