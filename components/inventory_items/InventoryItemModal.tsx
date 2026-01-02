"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { DECIMAL_REGEX } from "@/lib/Constants";
import { showErrorToast } from "@/lib/helpers/Helper";
import type {
	Category,
	InventoryItem,
	InventoryItemVariant,
	Variant,
} from "@/lib/types/Models";
import { useLoadingContext } from "../context_apis/LoadingProvider";
import { CancelButton, SaveButton } from "../helpers/buttons";
import MultiSelect from "../helpers/MultiSelect";

interface InventoryItemModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: InventoryItem | null;
	categories: Category[];
	variants: Variant[];
	onSave: (item: InventoryItem) => void;
}

const emptyEntry: InventoryItem = {
	sku: "",
	name: "",
	description: "",
	category_id: "",
	quantity: 0,
	min_quantity: 0,
	unit_price: 0,
};

export function InventoryItemModal({
	isOpen,
	onClose,
	item,
	categories,
	variants,
	onSave,
}: InventoryItemModalProps) {
	// When single option, select it by default
	if (categories.length === 1) {
		emptyEntry.category_id = categories[0].id;
	}
	const [formData, setFormData] = useState<Partial<InventoryItem>>(emptyEntry);
	const [selectedVariants, setSelectedVariants] = useState<Variant[]>([]);
	const [itemVariants, setItemVariants] = useState<InventoryItemVariant[]>([]);
	const { loading } = useLoadingContext();

	useEffect(() => {
		if (!isOpen) return;

		if (item) {
			setFormData(item);
			setItemVariants(item.item_variants || []);
			const itemVariants = item?.item_variants?.map((iv) => iv.variant);
			setSelectedVariants(itemVariants);
		} else {
			setFormData(emptyEntry);
			setSelectedVariants([]);
		}
	}, [isOpen, item]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.sku || !formData.name || !formData.category_id) {
			showErrorToast("Please fill in all required fields.");
			return;
		}

		// keep existing variants if reselected
		const itemVariantsToinsert: InventoryItemVariant[] = selectedVariants.map(
			(v) => {
				const itemVariant = itemVariants.find((iv) => iv.variant_id === v.id);
				return {
					...(itemVariant && { id: itemVariant.id }),
					inventory_item_id: item?.id,
					variant_id: v.id,
				};
			},
		);

		const newItem: InventoryItem = {
			id: item?.id,
			sku: formData.sku,
			name: formData.name,
			description: formData.description || "",
			category_id: formData.category_id,
			quantity: item?.quantity || 0,
			min_quantity: formData.min_quantity || 0,
			unit_price: formData.unit_price || 0,
			...(item?.status && { status: item?.status }),
			...(item?.created_at && { created_at: item?.created_at }),
			item_variants: itemVariantsToinsert,
		};

		onSave(newItem);
	};

	const handleInputChange = (field: keyof InventoryItem, value) => {
		if (value && field === "unit_price" && !DECIMAL_REGEX.test(value)) {
			return;
		}

		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const onMultiSeletChange = (selectedValues) => {
		setSelectedVariants(selectedValues);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold text-gray-900">
						{item ? "Edit Item" : "Add New Item"}
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
							SKU *
						</span>
						<input
							type="text"
							value={formData.sku}
							onChange={(e) => handleInputChange("sku", e.target.value)}
							className="input-field"
							required
						/>
					</div>

					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Category *
						</span>
						<select
							value={formData.category_id}
							onChange={(e) => handleInputChange("category_id", e.target.value)}
							className="input-field"
							required
						>
							<option value="">Select category</option>
							{categories.map((category) => (
								<option key={category.id} value={category.id}>
									{category.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<div className="w-full flex">
							<div className="w-1/2">
								<span className="block text-sm font-medium text-gray-700 mb-1">
									Unit Price
								</span>
								<div className="relative">
									<input
										type="text"
										value={formData.unit_price > 0 ? formData.unit_price : ""}
										onChange={(e) =>
											handleInputChange("unit_price", e.target.value)
										}
										className="input-field"
										required
									/>
								</div>
							</div>
							<div className="w-1/2 pl-2">
								<span className="block text-sm font-medium text-gray-700 mb-1">
									Min Quantity
								</span>
								<input
									type="number"
									value={formData.min_quantity}
									onChange={(e) =>
										handleInputChange(
											"min_quantity",
											parseInt(e.target.value, 10),
										)
									}
									className="input-field"
									min="0"
								/>
							</div>
						</div>
					</div>

					<MultiSelect
						options={variants}
						preSelectedValues={selectedVariants}
						changeHandler={onMultiSeletChange}
					/>

					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Description
						</span>
						<textarea
							value={formData.description}
							onChange={(e) => handleInputChange("description", e.target.value)}
							className="input-field"
							rows={2}
						/>
					</div>

					<div className="flex justify-end space-x-3 pt-4">
						<CancelButton loading={loading} onClose={onClose} />
						<SaveButton loading={loading} label={item ? "Update" : "Create"} />
					</div>
				</form>
			</div>
		</div>
	);
}
