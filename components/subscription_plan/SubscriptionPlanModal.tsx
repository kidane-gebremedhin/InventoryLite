"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import {
	BILLING_CYCLES,
	CURRENCY_TYPES,
	SUBSCRIPTION_TIERS,
} from "@/lib/Constants";
import { showErrorToast } from "@/lib/helpers/Helper";
import type { SubscriptionPlan } from "@/lib/types/Models";
import { useLoadingContext } from "../context_apis/LoadingProvider";
import { CancelButton, SaveButton } from "../helpers/buttons";

interface SubscriptionPlanModalProps {
	isOpen: boolean;
	onClose: () => void;
	subscriptionPlan: SubscriptionPlan | null;
	onSave: (subscriptionPlan: SubscriptionPlan) => void;
}

export function SubscriptionPlanModal({
	isOpen,
	onClose,
	subscriptionPlan,
	onSave,
}: SubscriptionPlanModalProps) {
	const emptyEntry: Partial<SubscriptionPlan> = {
		billing_cycle: "",
		subscription_tier: "",
		currency_type: "",
		payment_amount: 0,
	};

	const [formData, setFormData] =
		useState<Partial<SubscriptionPlan>>(emptyEntry);
	const { loading } = useLoadingContext();

	useEffect(() => {
		if (!isOpen) return;

		if (subscriptionPlan) {
			setFormData(subscriptionPlan);
		} else {
			setFormData(emptyEntry);
		}
	}, [subscriptionPlan, isOpen]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!formData.currency_type ||
			!formData.subscription_tier ||
			!formData.billing_cycle ||
			!formData.payment_amount
		) {
			showErrorToast("Please fill in all required fields.");
			return;
		}

		const newSubscriptionPlan: SubscriptionPlan = {
			id: subscriptionPlan?.id,
			subscription_tier: formData.subscription_tier,
			billing_cycle: formData.billing_cycle,
			currency_type: formData.currency_type,
			payment_amount: formData.payment_amount,
		};

		onSave(newSubscriptionPlan);
	};

	const handleInputChange = (field: keyof SubscriptionPlan, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold text-gray-900">
						Manage Subscription Plans
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<XMarkIcon className="h-6 w-6" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Subscription Tier *
						</span>
						<select
							value={formData.subscription_tier}
							onChange={(e) =>
								handleInputChange("subscription_tier", e.target.value)
							}
							className="input-field"
							required
						>
							<option value="">Select Subscription Tier</option>
							{SUBSCRIPTION_TIERS.map((tier) => (
								<option key={tier} value={tier}>
									{tier}
								</option>
							))}
						</select>
					</div>
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Billing Cycle *
						</span>
						<select
							value={formData.billing_cycle}
							onChange={(e) =>
								handleInputChange("billing_cycle", e.target.value)
							}
							className="input-field"
							required
						>
							<option value="">Select billing cycle</option>
							{BILLING_CYCLES.map((billingCycle) => (
								<option key={billingCycle} value={billingCycle}>
									{billingCycle}
								</option>
							))}
						</select>
					</div>
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Currency *
						</span>
						<select
							value={formData.currency_type}
							onChange={(e) =>
								handleInputChange("currency_type", e.target.value)
							}
							className="input-field"
							required
						>
							<option value="">Select Currency</option>
							{CURRENCY_TYPES.map((currency) => (
								<option key={currency} value={currency}>
									{currency}
								</option>
							))}
						</select>
					</div>
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Payment Amount *
						</span>
						<input
							type="text"
							value={formData.payment_amount > 0 ? formData.payment_amount : ""}
							onChange={(e) =>
								handleInputChange("payment_amount", e.target.value)
							}
							className="input-field"
							required
						/>
					</div>
					<div className="flex justify-end space-x-3 pt-4">
						<CancelButton loading={loading} onClose={onClose} />
						<SaveButton loading={loading} />
					</div>
				</form>
			</div>
		</div>
	);
}
