"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { showErrorToast } from "@/lib/helpers/Helper";
import type { Customer } from "@/lib/types/Models";
import { useLoadingContext } from "../context_apis/LoadingProvider";
import { CancelButton, SaveButton } from "../helpers/buttons";

const emptyEntry: Customer = {
	name: "",
	email: "",
	phone: "",
	address: "",
};

interface CustomerModalProps {
	isOpen: boolean;
	onClose: () => void;
	customer: Customer | null;
	onSave: (customer: Customer) => void;
}

interface FormErrors {
	name?: string;
	email?: string;
	phone?: string;
}

export default function CustomerModal({
	isOpen,
	onClose,
	customer,
	onSave,
}: CustomerModalProps) {
	const [formData, setFormData] = useState<Partial<Customer>>(emptyEntry);
	const [errors, setErrors] = useState<FormErrors>({});
	const { loading } = useLoadingContext();

	const resetForm = useCallback(() => {
		setFormData({
			name: "",
			email: "",
			phone: "",
			address: "",
		});
		setErrors({});
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		if (customer) {
			setFormData({
				name: customer.name || "",
				email: customer.email || "",
				phone: customer.phone || "",
				address: customer.address || "",
			});
		} else {
			resetForm();
		}
		setErrors({});
	}, [isOpen, customer, resetForm]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name) {
			showErrorToast("Please fill in all required fields.");
			return;
		}

		const newCustomer: Customer = {
			id: customer?.id,
			name: formData.name.trim(),
			email: formData.email?.trim() || "",
			phone: formData.phone?.trim() || "",
			address: formData.address?.trim() || "",
			status: customer?.status,
		};

		onSave(newCustomer);
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-bold">
						{customer ? "Edit Customer" : "New Customer"}
					</h2>
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
							Customer Name *
						</span>
						<input
							type="text"
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
							className={`input-field ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
							placeholder="Enter customer name"
							autoFocus
							required
						/>
						{errors.name && (
							<p className="mt-1 text-sm text-red-600">{errors.name}</p>
						)}
					</div>

					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Email
						</span>
						<input
							type="email"
							value={formData.email}
							onChange={(e) => handleInputChange("email", e.target.value)}
							className={`input-field ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
							placeholder="customer@example.com"
						/>
						{errors.email && (
							<p className="mt-1 text-sm text-red-600">{errors.email}</p>
						)}
					</div>

					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Phone
						</span>
						<input
							type="tel"
							value={formData.phone}
							onChange={(e) => handleInputChange("phone", e.target.value)}
							className={`input-field ${errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
							placeholder="+1 (555) 123-4567"
						/>
						{errors.phone && (
							<p className="mt-1 text-sm text-red-600">{errors.phone}</p>
						)}
					</div>

					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Address
						</span>
						<textarea
							value={formData.address}
							onChange={(e) => handleInputChange("address", e.target.value)}
							className="input-field"
							rows={3}
							placeholder="Enter customer address"
						/>
					</div>

					<div className="flex justify-end space-x-3 pt-4">
						<CancelButton loading={loading} onClose={onClose} />
						<SaveButton
							loading={loading}
							label={customer ? "Update Customer" : "Create Customer"}
						/>
					</div>
				</form>
			</div>
		</div>
	);
}
