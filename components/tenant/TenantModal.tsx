"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { showErrorToast } from "@/lib/helpers/Helper";
import type { AffiliatePartner, Tenant } from "@/lib/types/Models";
import { useLoadingContext } from "../context_apis/LoadingProvider";
import { CancelButton, SaveButton } from "../helpers/buttons";

interface TenantModalProps {
	isOpen: boolean;
	onClose: () => void;
	tenant: Tenant | null;
	affiliatePartners: AffiliatePartner[];
	onSave: (tenant: Partial<Tenant>) => void;
}

export function TenantModal({
	isOpen,
	onClose,
	tenant,
	affiliatePartners,
	onSave,
}: TenantModalProps) {
	const [formData, setFormData] = useState<Partial<Tenant>>(null);
	const { loading } = useLoadingContext();

	useEffect(() => {
		setFormData({
			id: tenant?.id,
			affiliate_partner_id: tenant?.affiliate_partner_id || "",
		});
	}, [tenant]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.affiliate_partner_id) {
			showErrorToast("Please fill in all required fields.");
			return;
		}

		const updatedTenant: Partial<Tenant> = {
			id: tenant?.id,
			affiliate_partner_id: formData.affiliate_partner_id,
		};

		onSave(updatedTenant);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold text-gray-900">
						{tenant ? "Edit" : "Add New"}
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
							Affiliate Partner *
						</span>
						<select
							value={formData.affiliate_partner_id}
							onChange={(e) =>
								setFormData({
									...formData,
									affiliate_partner_id: e.target.value,
								})
							}
							className="input-field"
							autoFocus
							required
						>
							<option value="">Select partner</option>
							{affiliatePartners.map((affiliatePartner) => (
								<option key={affiliatePartner.id} value={affiliatePartner.id}>
									{affiliatePartner.name}
								</option>
							))}
						</select>
					</div>

					<div className="flex justify-end space-x-3 pt-4">
						<CancelButton loading={loading} onClose={onClose} />
						<SaveButton loading={loading} label={"Update Affiliate Partner"} />
					</div>
				</form>
			</div>
		</div>
	);
}
