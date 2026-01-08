"use client";

import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { DECIMAL_REGEX, VALIDATION_ERRORS_MAPPING } from "@/lib/Constants";
import { RecordStatus, SalesOrderStatus } from "@/lib/Enums";
import {
	calculateOrderTotalProce,
	showErrorToast,
	showServerErrorToast,
} from "@/lib/helpers/Helper";
import { saveCustomer } from "@/lib/server_actions/customer";
import type {
	Customer,
	InventoryItem,
	SalesOrder,
	SalesOrderItem,
	Store,
	Variant,
} from "@/lib/types/Models";
import { useLoadingContext } from "../context_apis/LoadingProvider";
import { CancelButton, SaveButton } from "../helpers/buttons";
import Tooltip from "../helpers/ToolTip";

interface SalesOrderModalProps {
	isOpen: boolean;
	onClose: () => void;
	order: SalesOrder | null;
	stores: Store[];
	customers: Customer[];
	inventoryItems: InventoryItem[];
	variants: Variant[];
	onSave: (order: SalesOrder) => void;
}

const emptyEntry: SalesOrder = {
	so_number: "",
	customer_id: "",
	order_status: SalesOrderStatus.PENDING,
	expected_date: "",
	status: RecordStatus.ACTIVE,
	created_at: "",
	updated_at: "",
	order_items: [],
};

export default function SalesOrderModal({
	isOpen,
	onClose,
	order,
	stores,
	customers,
	inventoryItems,
	variants,
	onSave,
}: SalesOrderModalProps) {
	const { loading } = useLoadingContext();
	const [formData, setFormData] = useState<Partial<SalesOrder>>(emptyEntry);
	const [addNewCustomer, setAddNewCustomer] = useState<boolean>(false);
	const [isAddingCustomer, setIsAddingCustomer] = useState<boolean>(false);
	const [newCustomerName, setNewCustomerName] = useState<string>("");
	const [salesOrderItems, setSalesOrderItems] = useState<SalesOrderItem[]>([]);
	const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);

	const resetForm = useCallback(() => {
		setFormData({
			so_number: "",
			customer_id: "",
			expected_date: "",
			order_status: SalesOrderStatus.PENDING,
		});
		setSalesOrderItems([]);
	}, []);

	useEffect(() => {
		setCustomerOptions(customers);
	}, [customers]);

	useEffect(() => {
		if (!isOpen) return;

		// reset form
		setFormData(emptyEntry);

		if (order) {
			setFormData({
				so_number: order.so_number || "",
				customer_id: order.customer_id || "",
				expected_date: order.expected_date ? order.expected_date : "",
				order_status: order.order_status || SalesOrderStatus.PENDING,
			});
			setSalesOrderItems(order.order_items || []);
		} else {
			resetForm();
		}
	}, [isOpen, order, resetForm]);

	const addItem = () => {
		const unitPrice =
			inventoryItems.length === 1 ? inventoryItems[0].unit_price : 0;
		setSalesOrderItems([
			...salesOrderItems,
			{
				inventory_item_id: "",
				quantity: 1,
				unit_price: unitPrice,
				variant_id: "",
				store_id: stores.length === 1 ? stores[0].id : "",
			},
		]);
	};

	const removeItem = (index: number) => {
		setSalesOrderItems(salesOrderItems.filter((_, i) => i !== index));
	};

	const updateItem = (index: number, field: keyof SalesOrderItem, value) => {
		if (value && field === "unit_price" && !DECIMAL_REGEX.test(value)) {
			return;
		}

		const preSelectedItem = salesOrderItems.find(
			(item) => item.inventory_item_id === value,
		);
		if (preSelectedItem) {
			showErrorToast("Item already selected.");
			return;
		}
		const newItems = [...salesOrderItems];
		newItems[index] = { ...newItems[index], [field]: value };

		// Auto-fill unit price when item is selected
		if (field === "inventory_item_id") {
			const selectedItem = inventoryItems.find((item) => item.id === value);
			if (selectedItem) {
				newItems[index].unit_price = selectedItem.unit_price;
			}
		}

		setSalesOrderItems(newItems);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (salesOrderItems.length === 0) {
			showErrorToast("Please add at least one item");
			return;
		}

		if (salesOrderItems.some((item) => !item.inventory_item_id)) {
			showErrorToast("Please select all sales order items");
			return;
		}

		const itemsToInsert: SalesOrderItem[] = salesOrderItems.map((item) => ({
			...(item.id && { id: item.id }),
			store_id: item.store_id,
			variant_id: item?.variant_id,
			sales_order_id: order?.id || "",
			inventory_item_id: item.inventory_item_id || "",
			quantity: item.quantity || 0,
			unit_price: item.unit_price || 0,
		}));

		const newSalesOrder: SalesOrder = {
			id: order?.id || "",
			so_number: formData.so_number || "",
			customer_id: formData.customer_id || "",
			order_status: formData.order_status,
			status: order?.status || RecordStatus.ACTIVE,
			expected_date: formData.expected_date,
			order_items: itemsToInsert,
		};

		onSave(newSalesOrder);
	};

	const handleCreateNewCustomer = async () => {
		try {
			setIsAddingCustomer(true);
			const { data, error } = await saveCustomer({ name: newCustomerName });

			if (error) {
				handleServerError(error);
				return;
			}

			setCustomerOptions((prev) => [...prev, ...data]);
			setFormData({ ...formData, customer_id: data[0].id });
			setNewCustomerName("");
			setAddNewCustomer(false);
		} catch (_error) {
			showErrorToast();
		} finally {
			setIsAddingCustomer(false);
		}
	};

	const handleServerError = (error: PostgrestError) => {
		if (error.message.includes(VALIDATION_ERRORS_MAPPING.serverError)) {
			showErrorToast(
				VALIDATION_ERRORS_MAPPING.entities.customer.fields.name.displayError,
			);
		} else {
			showServerErrorToast(error.message);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-bold">
						{order ? "Edit Sales Order" : "New Sales Order"}
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
					{/* Basic Information */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<span className="block text-sm font-medium text-gray-700 mb-1">
								Order Number *
							</span>
							<input
								type="text"
								value={formData.so_number}
								onChange={(e) =>
									setFormData({ ...formData, so_number: e.target.value })
								}
								className="input-field"
								autoFocus
								required
							/>
						</div>

						<div>
							<div className="w-full flex">
								<div className="w-3/4">
									<span className="block text-sm font-medium text-gray-700 mb-1">
										Customer *
									</span>
								</div>
								<div className="w-1/4">
									<PlusIcon
										className="h-5 w-5 mr-1 ml-auto cursor-pointer text-gray-900 hover:text-green-600 transition"
										strokeWidth={2.5}
										onClick={() => {
											setAddNewCustomer(true);
										}}
									/>
								</div>
							</div>
							{!isAddingCustomer ? (
								<div>
									{addNewCustomer ? (
										<input
											type="text"
											value={newCustomerName}
											onChange={(e) => setNewCustomerName(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													e.stopPropagation();
													handleCreateNewCustomer();
												}
											}}
											className="input-field"
											autoFocus
											placeholder="Enter new customer name"
											required
										/>
									) : (
										<select
											value={formData.customer_id}
											onChange={(e) =>
												setFormData({
													...formData,
													customer_id: e.target.value,
												})
											}
											className="input-field"
											required
										>
											{customerOptions.map((customer) => (
												<option key={customer.id} value={customer.id}>
													{customer.name}
												</option>
											))}
										</select>
									)}
								</div>
							) : (
								<span>Saving...</span>
							)}
						</div>

						<div>
							<span className="block text-sm font-medium text-gray-700 mb-1">
								Expected Date
							</span>
							<input
								type="date"
								value={formData.expected_date}
								onChange={(e) =>
									setFormData({ ...formData, expected_date: e.target.value })
								}
								className="input-field"
								required
							/>
						</div>
					</div>

					{/* Items Section */}
					<div>
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-medium">Order Items</h3>
							<button
								type="button"
								onClick={addItem}
								className="btn-outline-success text-xs flex items-center"
							>
								<PlusIcon className="h-4 w-4 mr-2" />
								Add Item
							</button>
						</div>

						{salesOrderItems.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								No sales order items added yet. Click "Add Item" to get started.
							</div>
						) : (
							<div className="space-y-4">
								{salesOrderItems.map((item, index) => (
									<div
										key={index}
										className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg"
									>
										<div>
											<span className="block text-sm font-medium text-gray-700 mb-1">
												Item *
											</span>
											<select
												value={item.inventory_item_id}
												onChange={(e) =>
													updateItem(index, "inventory_item_id", e.target.value)
												}
												className={`input-field ${item?.id !== undefined ? "btn-secondary" : ""}`}
												required
												disabled={item?.id !== undefined}
											>
												<option value="">Select Item</option>
												{inventoryItems.map((invItem) => (
													<option key={invItem.id} value={invItem.id}>
														{invItem.sku} - {invItem.name} ({invItem.unit_price}
														)
													</option>
												))}
											</select>
										</div>

										<div>
											<span className="block text-sm font-medium text-gray-700 mb-1">
												Quantity *
											</span>
											<input
												type="number"
												min={1}
												step={1}
												value={item.quantity || 0}
												onChange={(e) =>
													updateItem(
														index,
														"quantity",
														parseInt(e.target.value, 10),
													)
												}
												className="input-field"
												required
											/>
										</div>

										<div>
											<span className="block text-sm font-medium text-gray-700 mb-1">
												Unit Price *
											</span>
											<input
												type="text"
												value={item.unit_price > 0 ? item.unit_price : ""}
												onChange={(e) =>
													updateItem(index, "unit_price", e.target.value)
												}
												className="input-field"
												required
											/>
										</div>

										<div>
											<span className="block text-sm font-medium text-gray-700 mb-1">
												Variant
											</span>
											<select
												value={item.variant_id}
												onChange={(e) =>
													updateItem(index, "variant_id", e.target.value)
												}
												className="input-field"
											>
												<option value="">Select Variant</option>
												{variants
													.filter((variant) => {
														const selectedItem = inventoryItems.find(
															(i) => i.id === item.inventory_item_id,
														);
														return (
															selectedItem?.item_variants?.find(
																(iv) => iv.variant_id === variant.id,
															) !== undefined
														);
													})
													.map((variant) => (
														<option key={variant.id} value={variant.id}>
															{variant.name}
														</option>
													))}
											</select>
										</div>

										<div>
											<span className="block text-sm font-medium text-gray-700 mb-1">
												Store *
											</span>
											<select
												value={item.store_id}
												onChange={(e) =>
													updateItem(index, "store_id", e.target.value)
												}
												className="input-field"
												required
											>
												<option value="">Select Store</option>
												{stores.map((store) => (
													<option key={store.id} value={store.id}>
														{store.name}
													</option>
												))}
											</select>
										</div>
										<div className="items-center">
											<span className="block text-sm font-medium text-gray-700 mb-1">
												&nbsp;
											</span>
											<Tooltip text="Remove">
												<button
													type="button"
													onClick={() => removeItem(index)}
													className="hidden md:block md:mt-3 text-red-600 hover:text-red-900"
												>
													<TrashIcon className="h-4 w-4" />
												</button>
												<button
													type="button"
													onClick={() => removeItem(index)}
													className="flex block md:hidden md:mt-3 text-red-600 hover:text-red-900"
												>
													<TrashIcon className="h-4 w-4 mt-1" />
													<span className="px-2">Remove</span>
												</button>
											</Tooltip>
										</div>
									</div>
								))}

								<div className="text-right">
									<p className="text-lg font-medium">
										Total Value:{" "}
										{calculateOrderTotalProce(salesOrderItems).toFixed(2)}
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Form Actions */}
					<div className="flex justify-end space-x-3 pt-6 border-t">
						<CancelButton loading={loading} onClose={onClose} />
						<SaveButton
							loading={loading}
							label={order ? "Update Order" : "Create Order"}
						/>
					</div>
				</form>
			</div>
		</div>
	);
}
