"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { SubscriptionStatus } from "@/lib/Enums";
import { showErrorToast } from "@/lib/helpers/Helper";
import type { ManualPayment } from "@/lib/types/Models";
import { useLoadingContext } from "../context_apis/LoadingProvider";
import { CancelButton, SaveButton } from "../helpers/buttons";
import { useAuthContext } from "../providers/AuthProvider";

interface ManualPaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	manualPayment: ManualPayment | null;
	subscriptionMessage: string;
	onSave: (manualPayment: ManualPayment) => void;
}

export function ManualPaymentModal({
	isOpen,
	onClose,
	manualPayment,
	subscriptionMessage,
	onSave,
}: ManualPaymentModalProps) {
	const { currentUser } = useAuthContext();
	const emptyEntry: Partial<ManualPayment> = {
		reference_number: "",
		amount: 0,
		description: "",
	};

	const [formData, setFormData] = useState<Partial<ManualPayment>>(emptyEntry);
	const { loading } = useLoadingContext();

	useEffect(() => {
		if (!isOpen) return;

		if (manualPayment) {
			setFormData(manualPayment);
		} else {
			setFormData(emptyEntry);
		}
	}, [manualPayment, isOpen]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.reference_number) {
			showErrorToast("Please fill in all required fields.");
			return;
		}

		const newManualPayment: ManualPayment = {
			id: manualPayment?.id,
			reference_number: formData.reference_number,
			amount: currentUser?.subscriptionInfo?.expected_payment_amount,
			status: manualPayment?.status,
			description: manualPayment?.description,
		};

		onSave(newManualPayment);
	};

	const handleInputChange = (field: keyof ManualPayment, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const allowCancelButton =
		currentUser?.subscriptionInfo?.subscription_status !==
		SubscriptionStatus.EXPIRED;

	if (!isOpen) return null;

	if (!currentUser?.subscriptionInfo.currency_type) {
		return (
			<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
				<div className="relative top-64 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
					<div className="flex justify-center items-center">
						Subscription plan is not configured.
						<button
							type="button"
							onClick={onClose}
							className="text-red-400 hover:text-red-600"
						>
							<XMarkIcon className="h-6 w-6" />
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold text-gray-900">
						{manualPayment ? "Edit" : "Make Payment"}
					</h3>
					{allowCancelButton && (
						<button
							type="button"
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600"
						>
							<XMarkIcon className="h-6 w-6" />
						</button>
					)}
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="w-full bg-white rounded-lg shadow border p-6">
						<p>{subscriptionMessage}</p>
					</div>
					<div>
						<h3 className="text-green-400 mx-4">
							<ul style={{ listStyleType: "square" }}>
								<li>
									Please transfer{" "}
									<u>
										{currentUser?.subscriptionInfo?.currency_type}
										{currentUser?.subscriptionInfo?.expected_payment_amount}
									</u>{" "}
									to the account number{" "}
									<u>{process.env.NEXT_PUBLIC_APP_BANK_ACCOUNT_NUMBER}</u>
								</li>
								<li>Enter reference number for payment</li>
							</ul>
						</h3>
					</div>
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Reference number *
						</span>
						<input
							type="text"
							value={formData.reference_number}
							onChange={(e) =>
								handleInputChange("reference_number", e.target.value)
							}
							className="input-field"
							minLength={6}
							autoFocus
							required
						/>
					</div>
					<div className="flex justify-end space-x-3 pt-4">
						{allowCancelButton && (
							<CancelButton loading={loading} onClose={onClose} />
						)}
						<SaveButton
							loading={loading}
							label={manualPayment ? "Update" : "Make Payment"}
						/>
					</div>
				</form>
			</div>
		</div>
	);
}
