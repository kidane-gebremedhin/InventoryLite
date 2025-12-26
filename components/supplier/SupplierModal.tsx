"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { showErrorToast } from "@/lib/helpers/Helper";
import type { Supplier } from "@/lib/types/Models";

const emptyEntry: Supplier = {
	name: "",
	email: "",
	phone: "",
	address: "",
};

interface SupplierModalProps {
	isOpen: boolean;
	onClose: () => void;
	supplier: Supplier | null;
	onSave: (supplier: Supplier) => void;
}

interface FormErrors {
	name?: string;
	email?: string;
	phone?: string;
}

export default function SupplierModal({
	isOpen,
	onClose,
	supplier,
	onSave,
}: SupplierModalProps) {
	const [loading] = useState(false);
	const [formData, setFormData] = useState<Partial<Supplier>>(emptyEntry);
	const [errors, setErrors] = useState<FormErrors>({});

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
		if (isOpen) {
			if (supplier) {
				setFormData({
					name: supplier.name || "",
					email: supplier.email || "",
					phone: supplier.phone || "",
					address: supplier.address || "",
				});
			} else {
				resetForm();
			}
			setErrors({});
		}
	}, [isOpen, supplier, resetForm]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name) {
			showErrorToast("Please fill in all required fields.");
			return;
		}

		const newSupplier: Supplier = {
			id: supplier?.id,
			name: formData.name.trim(),
			email: formData.email?.trim() || "",
			phone: formData.phone?.trim() || "",
			address: formData.address?.trim() || "",
			status: supplier?.status,
		};

		onSave(newSupplier);
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
						{supplier ? "Edit Supplier" : "New Supplier"}
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
							Supplier Name *
						</span>
						<input
							type="text"
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
							className={`input-field ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
							placeholder="Enter supplier name"
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
							placeholder="supplier@example.com"
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
							placeholder="Enter supplier address"
						/>
					</div>

					<div className="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="btn-outline-default"
							disabled={loading}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="btn-outline-primary"
							disabled={loading}
						>
							{loading
								? "Saving..."
								: supplier
									? "Update Supplier"
									: "Create Supplier"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
