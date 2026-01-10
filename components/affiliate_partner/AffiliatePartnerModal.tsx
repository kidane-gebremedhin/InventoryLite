"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { COMMISSION_TYPES } from "@/lib/Constants";
import { showErrorToast } from "@/lib/helpers/Helper";
import type { AffiliatePartner } from "@/lib/types/Models";
import { useLoadingContext } from "../context_apis/LoadingProvider";
import { CancelButton, SaveButton } from "../helpers/buttons";

interface AffiliatePartnerModalProps {
	isOpen: boolean;
	onClose: () => void;
	affiliatePartner: AffiliatePartner | null;
	onSave: (affiliatePartner: AffiliatePartner) => void;
}

const emptyEntry: Partial<AffiliatePartner> = {
	name: "",
	description: "",
	commission_type: "",
	commission_value: 0,
};

export function AffiliatePartnerModal({
	isOpen,
	onClose,
	affiliatePartner,
	onSave,
}: AffiliatePartnerModalProps) {
	const [formData, setFormData] =
		useState<Partial<AffiliatePartner>>(emptyEntry);
	const { loading } = useLoadingContext();

	useEffect(() => {
		if (!isOpen) return;

		if (affiliatePartner) {
			setFormData(affiliatePartner);
		} else {
			setFormData(emptyEntry);
		}
	}, [affiliatePartner, isOpen]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!formData.name ||
			!formData.commission_type ||
			!formData.commission_value
		) {
			showErrorToast("Please fill in all required fields.");
			return;
		}

		const newAffiliatePartner: AffiliatePartner = {
			id: affiliatePartner?.id,
			name: formData.name,
			description: formData.description,
			commission_type: formData.commission_type,
			commission_value: formData.commission_value,
		};

		onSave(newAffiliatePartner);
	};

	const handleInputChange = (field: keyof AffiliatePartner, value) => {
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
						Manage Affiliate Partners
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
							Name *
						</span>
						<input
							type="text"
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
							className="input-field"
							autoFocus
							required
						/>
					</div>
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Commission Type *
						</span>
						<select
							value={formData.commission_type}
							onChange={(e) =>
								handleInputChange("commission_type", e.target.value)
							}
							className="input-field"
							required
						>
							<option value="">Select Commission Type</option>
							{COMMISSION_TYPES.map((commissionType) => (
								<option key={commissionType} value={commissionType}>
									{commissionType}
								</option>
							))}
						</select>
					</div>
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Commission Value *
						</span>
						<input
							type="text"
							value={
								formData.commission_value > 0 ? formData.commission_value : ""
							}
							onChange={(e) =>
								handleInputChange("commission_value", e.target.value)
							}
							className="input-field"
							required
						/>
					</div>
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Description
						</span>
						<textarea
							value={formData.description}
							onChange={(e) => handleInputChange("description", e.target.value)}
							className="input-field"
							rows={3}
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
