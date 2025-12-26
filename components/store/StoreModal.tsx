"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { showErrorToast } from "@/lib/helpers/Helper";
import type { Store } from "@/lib/types/Models";

interface StoreModalProps {
	isOpen: boolean;
	onClose: () => void;
	store: Store | null;
	onSave: (store: Store) => void;
}

const emptyEntry: Store = {
	name: "",
	description: "",
};

export function StoreModal({
	isOpen,
	onClose,
	store,
	onSave,
}: StoreModalProps) {
	const [formData, setFormData] = useState<Partial<Store>>(emptyEntry);

	useEffect(() => {
		if (store) {
			setFormData(store);
		} else {
			setFormData(emptyEntry);
		}
	}, [store]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name) {
			showErrorToast("Please fill in all required fields.");
			return;
		}

		const newStore: Store = {
			id: store?.id,
			name: formData.name,
			description: formData.description || "",
			status: store?.status,
		};

		onSave(newStore);
	};

	const handleInputChange = (field: keyof Store, value) => {
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
						{store ? "Edit" : "Add New"}
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
						<button
							type="button"
							onClick={onClose}
							className="btn-outline-default"
						>
							Cancel
						</button>
						<button type="submit" className="btn-outline-primary">
							{store ? "Update" : "Create"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
