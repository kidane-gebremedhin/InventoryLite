"use client";

import {
	ArrowUpOnSquareIcon,
	EyeIcon,
	MagnifyingGlassIcon,
	PencilIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import type { PostgrestError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLoadingContext } from "@/components/context_apis/LoadingProvider";
import ExportExcel from "@/components/file_import_export/ExportExcel";
import ExportPDF from "@/components/file_import_export/ExportPDF";
import ActionsMenu from "@/components/helpers/ActionsMenu";
import { AddButton } from "@/components/helpers/buttons";
import { ConfirmationModal } from "@/components/helpers/ConfirmationModal";
import LowStock from "@/components/helpers/LowStock";
import Pagination from "@/components/helpers/Pagination";
import InventoryItemDetailsModal from "@/components/inventory_items/InventoryItemDetailsModal";
import { InventoryItemModal } from "@/components/inventory_items/InventoryItemModal";
import { useAuthContext } from "@/components/providers/AuthProvider";
import {
	ALL_OPTIONS,
	FIRST_PAGE_NUMBER,
	MAX_DROPDOWN_TEXT_LENGTH,
	RECORD_STATUSES,
	RECORDS_PER_PAGE,
	TEXT_SEARCH_TRIGGER_KEY,
	VALIDATION_ERRORS_MAPPING,
} from "@/lib/Constants";
import { RecordStatus } from "@/lib/Enums";
import {
	calculateStartAndEndIndex,
	getDateWithoutTime,
	getRecordStatusColor,
	shortenText,
	showErrorToast,
	showServerErrorToast,
	showSuccessToast,
} from "@/lib/helpers/Helper";
import { fetchCategoryOptions } from "@/lib/server_actions/category";
import {
	fetchInvetoryItems,
	saveInventoryItem,
	updateInventoryItem,
	updateInventoryItemRecordStatus,
} from "@/lib/server_actions/inventory_item";
import { fetchVariantOptions } from "@/lib/server_actions/variant";
import type { Category, InventoryItem, Variant } from "@/lib/types/Models";

export default function InventoryPage() {
	const router = useRouter();
	const [items, setItems] = useState<InventoryItem[]>([]);
	const [searchTermTemp, setSearchTermTemp] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [categories, setCategories] = useState<Category[]>([]);
	const [variants, setVariants] = useState<Variant[]>([]);
	const [selectedCategoryId, setSelectedCategory] = useState(ALL_OPTIONS);
	const [selectedStatus, setSelectedStatus] = useState(
		RecordStatus.ACTIVE.toString(),
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
	// Pagination
	const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE);
	const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER);
	const [totalRecordsCount, setTotalRecordsCount] = useState(0);

	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
	const [isInitialPageLoad, setIsInitialPageLoad] = useState(true);
	// Record Actions
	const [currentActiveId, setCurrentActiveId] = useState<string>("");
	const [isArchiveConfirmationModalOpen, setIsArchiveConfirmationModalOpen] =
		useState(false);
	const [isRestoreConfirmationModalOpen, setIsRestoreConfirmationModalOpen] =
		useState(false);
	// Global States
	const { setLoading } = useLoadingContext();
	const { currentUser } = useAuthContext();

	const reportHeaders = {
		sku: "SKU Code",
		name: "Item Name",
		description: "Description",
		category: "Category",
		quantity: "Available Quantity",
		min_quantity: "Minimum Quantity",
		unit_price: "Unit Price",
		created_at: "Date Created",
	};

	const loadInventoryItems = useCallback(
		async (cacheEnabled: boolean = true) => {
			const { startIndex, endIndex } = calculateStartAndEndIndex({
				currentPage,
				recordsPerPage,
			});

			try {
				setLoading(true);

				fetchInvetoryItems(
					{
						tenantId: currentUser?.subscriptionInfo?.tenant_id,
						selectedCategoryId,
						selectedStatus,
						searchTerm,
						startIndex,
						endIndex,
					},
					cacheEnabled,
				).then(({ data, count, error }) => {
					if (error) {
						showServerErrorToast(error.message);
					}
					setItems(data || []);
					setTotalRecordsCount(count || 0);
				});
			} catch (_error) {
				showErrorToast();
			} finally {
				setLoading(false);
			}
		},
		[
			searchTerm,
			selectedCategoryId,
			selectedStatus,
			recordsPerPage,
			currentPage,
			currentUser?.subscriptionInfo?.tenant_id,
			setLoading,
		],
	);

	const loadCategories = useCallback(async () => {
		try {
			fetchCategoryOptions(currentUser?.subscriptionInfo?.tenant_id).then(
				({ data, error }) => {
					if (error) {
						showServerErrorToast(error.message);
					}

					setCategories(data || []);
				},
			);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	}, [currentUser?.subscriptionInfo?.tenant_id, setLoading]);

	const loadVariants = useCallback(async () => {
		try {
			fetchVariantOptions(currentUser?.subscriptionInfo?.tenant_id).then(
				({ data, error }) => {
					if (error) {
						showServerErrorToast(error.message);
					}

					setVariants(data || []);
				},
			);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	}, [currentUser?.subscriptionInfo?.tenant_id, setLoading]);

	useEffect(() => {
		loadInventoryItems();
		loadCategories();
		loadVariants();
	}, [loadInventoryItems, loadCategories, loadVariants]);

	useEffect(() => {
		if (isInitialPageLoad) {
			setIsInitialPageLoad(false);
			// return shorty on initial page load
			return;
		}

		// reset pagination
		router.push(`?page=${currentPage}`);
		loadInventoryItems();
	}, [currentPage, isInitialPageLoad, router, loadInventoryItems]);

	const getCategoryName = (categoryId: string) => {
		const category = categories.find((category) => category.id === categoryId);
		return category?.name;
	};

	const handleAddItem = () => {
		setEditingItem(null);
		setIsModalOpen(true);
	};

	const handleViewDetails = (id: string) => {
		const order = items.find((item) => item.id === id);
		setSelectedItem(order);
		setShowDetailsModal(true);
	};

	const handleEdit = (id: string) => {
		const item = items.find((item) => item.id === id);
		setEditingItem(item);
		setIsModalOpen(true);
	};

	const handleArchive = async (id: string) => {
		resetModalState();

		try {
			const { error } = await updateInventoryItemRecordStatus(id, {
				status: RecordStatus.ARCHIVED,
			});

			if (error) {
				showServerErrorToast(error.message);
			} else {
				showSuccessToast("Record Archived.");
				const remainingRecords = items.filter((item) => item.id !== id);
				setItems(remainingRecords);
				setTotalRecordsCount(remainingRecords.length);
			}
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleRestore = async (id: string) => {
		resetModalState();

		try {
			const { error } = await updateInventoryItemRecordStatus(id, {
				status: RecordStatus.ACTIVE,
			});

			if (error) {
				showServerErrorToast(error.message);
			} else {
				showSuccessToast("Record Restored.");
				const remainingRecords = items.filter((item) => item.id !== id);
				setItems(remainingRecords);
				setTotalRecordsCount(remainingRecords.length);
			}
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async (inventoryItem: InventoryItem) => {
		try {
			// Exclude id when creating new records
			const { id, item_variants, ...inventoryItemWithNoId } = inventoryItem;

			const payload = {
				inventory_item_data: inventoryItemWithNoId,
				inventory_item_variants_data: inventoryItem.item_variants,
			};
			const { error } = await saveInventoryItem(payload);

			if (error) {
				handleServerError(error);
				return;
			}

			setIsModalOpen(false);
			showSuccessToast("Record Created.");
			loadInventoryItems(false);
			setEditingItem(null);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleUpdate = async (inventoryItem: InventoryItem) => {
		try {
			const { item_variants, ...inventoryItemWithNoId } = inventoryItem;

			const payload = {
				inventory_item_data: inventoryItemWithNoId,
				inventory_item_variants_data: inventoryItem.item_variants,
				is_for_update: true,
			};
			const { error } = await updateInventoryItem(payload);

			if (error) {
				handleServerError(error);
				return;
			}

			setIsModalOpen(false);
			showSuccessToast("Record Updated.");
			loadInventoryItems(false);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleTextSearch = () => {
		setCurrentPage(FIRST_PAGE_NUMBER);
		setSearchTerm(searchTermTemp.trim());
	};

	const resetModalState = () => {
		setCurrentActiveId("");
		setIsArchiveConfirmationModalOpen(false);
		setIsRestoreConfirmationModalOpen(false);
	};

	const handleServerError = (error: PostgrestError) => {
		if (error.message.includes(VALIDATION_ERRORS_MAPPING.serverError)) {
			const fields = VALIDATION_ERRORS_MAPPING.entities.inventory_item.fields;
			showErrorToast(
				error.message.includes("sku")
					? fields.sku.displayError
					: fields.name.displayError,
			);
		} else {
			showServerErrorToast(error.message);
		}
	};

	const getReportFields = (item, idx: number) => {
		return {
			row_no: idx > 0 ? idx : "Row No.",
			sku: item.sku,
			name: item.name,
			description: item.description,
			category: getCategoryName(item.category_id),
			quantity: item.quantity,
			min_quantity: item.min_quantity,
			unit_price: item.unit_price,
			created_at: getDateWithoutTime(item.created_at),
		};
	};

	return (
		<div className="space-y-6">
			<div className="w-full md:w-5/6">
				<div className="md:flex md:justify-between md:items-center">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							Inventory Items Management
						</h1>
						<p className="text-gray-600">
							Manage your inventory items and stock levels
						</p>
					</div>
					<AddButton label={"Add Item"} handleAdd={handleAddItem} />
				</div>
			</div>

			{/* Inventory Table */}
			<div className="card">
				<div className="w-full overflow-x-scroll p-4">
					<div className="w-[1050px]">
						<div className="w-full md:text-right md:items-right mb-4">
							<button
								type="button"
								className="btn-outline-default px-4 py-1 text-sm h-7 rounded items-center"
								onClick={() => {
									setShowFilters(!showFilters);
								}}
							>
								<b>Show Filters</b>
							</button>
							<span className="px-1"></span>
							<ExportExcel
								reportName="Inventory Items"
								records={[reportHeaders, ...items].map((item, idx) =>
									getReportFields(item, idx),
								)}
							/>
							<span className="px-1"></span>
							<ExportPDF
								reportName="Inventory Items"
								records={[reportHeaders, ...items].map((item, idx) =>
									getReportFields(item, idx),
								)}
							/>
						</div>
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Item
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										SKU
									</th>
									<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
										Category
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Unit Price
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Available Quantity
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Min Quantity
									</th>
									<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
										Record Status
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
								</tr>
								{showFilters && (
									<tr className="card">
										<th
											colSpan={2}
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											<div className="relative">
												<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
												<input
													type="text"
													placeholder="Search & Press ENTER"
													value={searchTermTemp}
													onChange={(e) => {
														setSearchTermTemp(e.target.value);
													}}
													onKeyDown={(e) => {
														if (e.key === TEXT_SEARCH_TRIGGER_KEY) {
															handleTextSearch();
														}
													}}
													onBlur={handleTextSearch}
													className="input-field pl-10"
												/>
											</div>
										</th>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											<select
												value={selectedCategoryId}
												onChange={(e) => {
													setCurrentPage(FIRST_PAGE_NUMBER);
													setSelectedCategory(e.target.value);
												}}
												className="input-field"
											>
												{[{ id: ALL_OPTIONS, name: "" }, ...categories].map(
													(category) => (
														<option key={category.id} value={category.id}>
															{category.id === ALL_OPTIONS
																? "All Categories"
																: shortenText(
																		category.name,
																		MAX_DROPDOWN_TEXT_LENGTH,
																	)}
														</option>
													),
												)}
											</select>
										</th>
										<th></th>
										<th></th>
										<th></th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											<select
												value={selectedStatus}
												onChange={(e) => {
													setCurrentPage(FIRST_PAGE_NUMBER);
													setSelectedStatus(e.target.value);
												}}
												className="input-field"
											>
												{RECORD_STATUSES.map((status) => (
													<option key={status} value={status}>
														{status === ALL_OPTIONS ? ALL_OPTIONS : status}
													</option>
												))}
											</select>
										</th>
										<th></th>
									</tr>
								)}
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{items.map((item) => (
									<tr key={item.id} className="hover:bg-gray-50">
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{item.name}
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{item.sku}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 text-sm text-gray-900 text-center">
											{getCategoryName(item.category_id)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-900">
											{item.unit_price.toFixed(2)}
										</td>
										<td className="px-6 py-4 flex">
											<div className="text-sm text-gray-900">
												{item.quantity}
											</div>
											{item.quantity <= item.min_quantity && <LowStock />}
										</td>
										<td className="px-6 py-4">
											<div className="text-sm text-gray-900">
												{item.min_quantity}
											</div>
										</td>
										<td className="px-6 py-4 text-center">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(item.status)}`}
											>
												{item.status}
											</span>
										</td>
										<td className="px-6 py-4 text-right text-sm font-medium">
											<div className="flex justify-center space-x-2 items-center">
												<ActionsMenu
													actions={[
														{
															id: item.id,
															hideOption: false,
															icon: <EyeIcon className="h-4 w-4" />,
															label: "View Details",
															class:
																"w-full text-primary-600 hover:text-primary-900",
															listener: handleViewDetails,
														},
														{
															id: item.id,
															hideOption:
																selectedStatus === RecordStatus.ARCHIVED,
															icon: <PencilIcon className="h-4 w-4" />,
															label: "Edit",
															class:
																"w-full text-primary-600 hover:text-primary-900",
															listener: handleEdit,
														},
														{
															id: item.id,
															hideOption:
																selectedStatus !== RecordStatus.ACTIVE,
															icon: <TrashIcon className="h-4 w-4" />,
															label: "Archive",
															class: "w-full text-red-600 hover:text-red-900",
															listener: () => {
																setCurrentActiveId(item.id);
																setIsArchiveConfirmationModalOpen(true);
															},
														},
														{
															id: item.id,
															hideOption:
																selectedStatus === RecordStatus.ACTIVE,
															icon: <ArrowUpOnSquareIcon className="h-4 w-4" />,
															label: "Restore",
															class:
																"w-full text-yellow-600 hover:text-yellow-900",
															listener: () => {
																setCurrentActiveId(item.id);
																setIsRestoreConfirmationModalOpen(true);
															},
														},
													]}
												/>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						<Pagination
							currentPage={currentPage}
							recordsPerPage={recordsPerPage}
							totalRecordsCount={totalRecordsCount}
							setCurrentPage={setCurrentPage}
							setRecordsPerPage={setRecordsPerPage}
						/>
					</div>
				</div>
			</div>

			{/* Inventory Item Modal */}
			<InventoryItemModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				item={editingItem}
				categories={categories}
				variants={variants}
				onSave={(item) => {
					setLoading(true);
					if (editingItem) {
						handleUpdate(item);
					} else {
						handleCreate(item);
					}
				}}
			/>

			<InventoryItemDetailsModal
				isOpen={showDetailsModal && selectedItem !== null}
				onClose={() => setShowDetailsModal(false)}
				item={selectedItem}
			/>

			{/* Confirmation Modal for Archive */}
			<ConfirmationModal
				isOpen={isArchiveConfirmationModalOpen}
				id={currentActiveId}
				message="Are you sure you want to archive this inventory item?"
				onConfirmationSuccess={handleArchive}
				onConfirmationFailure={resetModalState}
			/>

			{/* Confirmation Modal for Restore */}
			<ConfirmationModal
				isOpen={isRestoreConfirmationModalOpen}
				id={currentActiveId}
				message="Are you sure you want to restore this inventory item?"
				onConfirmationSuccess={handleRestore}
				onConfirmationFailure={resetModalState}
			/>
		</div>
	);
}
