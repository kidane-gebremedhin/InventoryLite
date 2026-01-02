"use client";

import {
	ArrowUpOnSquareIcon,
	BackwardIcon,
	CheckIcon,
	EyeIcon,
	MagnifyingGlassIcon,
	PencilIcon,
	TrashIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
// DatePicker both are required
import DatePicker from "react-datepicker";
import Pagination from "@/components/helpers/Pagination";
import OrderDetailsModal from "@/components/purchase_orders/OrderDetailsModal";
import PurchaseOrderModal from "@/components/purchase_orders/PurchaseOrderModal";
import {
	ALL_OPTIONS,
	FIRST_PAGE_NUMBER,
	MAX_DROPDOWN_TEXT_LENGTH,
	PURCHASE_ORDER_STATUSES,
	RECORD_STATUSES,
	RECORDS_PER_PAGE,
	TEXT_SEARCH_TRIGGER_KEY,
	VALIDATION_ERRORS_MAPPING,
} from "@/lib/Constants";
import { PurchaseOrderStatus, RecordStatus } from "@/lib/Enums";
import {
	calculateStartAndEndIndex,
	canShowLoadingScreen,
	formatDateToLocalDate,
	getDateWithoutTime,
	getRecordStatusColor,
	shortenText,
	showErrorToast,
	showServerErrorToast,
	showSuccessToast,
} from "@/lib/helpers/Helper";
import type {
	InventoryItem,
	PurchaseOrder,
	Store,
	Supplier,
	Variant,
} from "@/lib/types/Models";
import "react-datepicker/dist/react-datepicker.css";

import type { PostgrestError } from "@supabase/supabase-js";
import { useLoadingContext } from "@/components/context_apis/LoadingProvider";
import ExportExcel from "@/components/file_import_export/ExportExcel";
import ExportPDF from "@/components/file_import_export/ExportPDF";
import ActionsMenu from "@/components/helpers/ActionsMenu";
import { AddButton } from "@/components/helpers/buttons";
import { ConfirmationModal } from "@/components/helpers/ConfirmationModal";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { fetchInventoryItemOptions } from "@/lib/server_actions/inventory_item";
import {
	fetchPurchaseOrders,
	savePurchaseOrder,
	updatePurchaseOrder,
	updatePurchaseOrderRecordStatus,
	updatePurchaseOrderStatus,
} from "@/lib/server_actions/purchase_order";
import { fetchStoreOptions } from "@/lib/server_actions/store";
import { fetchSupplierOptions } from "@/lib/server_actions/supplier";
import { fetchVariantOptions } from "@/lib/server_actions/variant";

export default function PurchaseOrderPage() {
	const router = useRouter();
	const [searchTermTemp, setSearchTermTemp] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [editingPurchaseOrder, setEditingPurchaseOrder] =
		useState<PurchaseOrder | null>(null);
	const [selectedStatus, setSelectedStatus] = useState(
		RecordStatus.ACTIVE.toString(),
	);
	// Pagination
	const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE);
	const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER);
	const [totalRecordsCount, setTotalRecordsCount] = useState(0);

	const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
		null,
	);
	const [selectedOrderStatus, setSelectedOrderStatus] = useState("");
	const [stores, setStores] = useState<Store[]>([]);
	const [suppliers, setSuppliers] = useState<Supplier[]>([]);
	const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
	const [variants, setVariants] = useState<Variant[]>([]);
	const [selectedSupplierId, setSelectedSupplier] = useState(ALL_OPTIONS);
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [receivedDateStart, setReceivedDateStart] = useState<Date | null>(null);
	const [receivedDateEnd, setReceivedDateEnd] = useState<Date | null>(null);
	const [isInitialPageLoad, setIsInitialPageLoad] = useState(true);
	// Record Actions
	const [currentActiveId, setCurrentActiveId] = useState<string>("");
	const [isArchiveConfirmationModalOpen, setIsArchiveConfirmationModalOpen] =
		useState(false);
	const [isRestoreConfirmationModalOpen, setIsRestoreConfirmationModalOpen] =
		useState(false);
	const [
		isMoveToPendingConfirmationModalOpen,
		setIsMoveToPendingConfirmationModalOpen,
	] = useState(false);
	const [
		isMoveToReceivedConfirmationModalOpen,
		setIsMoveToReceivedConfirmationModalOpen,
	] = useState(false);
	const [
		isMoveToCanceledConfirmationModalOpen,
		setIsMoveToCanceledConfirmationModalOpen,
	] = useState(false);
	// Global States
	const { setLoading } = useLoadingContext();
	const { currentUser } = useAuthContext();

	const reportHeaders = {
		row_no: "Row No.",
		po_number: "PO Number",
		supplier: "Supplier Name",
		order_status: "Order Status",
		expected_date: "Expected Date",
		received_date: "Received Date",
		created_at: "Ordered Date",
		store: "Store",
		item_name: "Item",
		item_sku: "SKU Code",
		quantity: "Quantity",
		unit_price: "Unit Price",
		order_items: [],
	};

	const loadPurchaseOrders = useCallback(async () => {
		setLoading(
			canShowLoadingScreen(
				startDate,
				endDate,
				receivedDateStart,
				receivedDateEnd,
			),
		);

		const { startIndex, endIndex } = calculateStartAndEndIndex({
			currentPage,
			recordsPerPage,
		});

		try {
			fetchPurchaseOrders({
				tenantId: currentUser?.subscriptionInfo?.tenant_id,
				selectedOrderStatus,
				selectedStatus,
				selectedSupplierId,
				searchTerm,
				startDate,
				endDate,
				receivedDateStart,
				receivedDateEnd,
				startIndex,
				endIndex,
			}).then(({ data, count, error }) => {
				if (error) {
					showServerErrorToast(error.message);
				}

				setPurchaseOrders(data || []);
				setTotalRecordsCount(count || 0);
			});
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	}, [
		currentUser?.subscriptionInfo?.tenant_id,
		selectedOrderStatus,
		selectedStatus,
		selectedSupplierId,
		searchTerm,
		startDate,
		endDate,
		receivedDateStart,
		receivedDateEnd,
		currentPage,
		recordsPerPage,
		setLoading,
	]);

	const loadStores = useCallback(async () => {
		fetchStoreOptions(currentUser?.subscriptionInfo?.tenant_id).then(
			({ data, error }) => {
				if (error) return;

				setStores(data || []);
			},
		);
	}, [currentUser?.subscriptionInfo?.tenant_id]);

	const loadSuppliers = useCallback(async () => {
		fetchSupplierOptions(currentUser?.subscriptionInfo?.tenant_id).then(
			({ data, error }) => {
				if (error) return;

				const selectableSuppliers: Supplier[] = [
					{ id: ALL_OPTIONS, name: "" },
					...data,
				];
				setSuppliers(selectableSuppliers);
			},
		);
	}, [currentUser?.subscriptionInfo?.tenant_id]);

	const loadVariants = useCallback(async () => {
		fetchVariantOptions(currentUser?.subscriptionInfo?.tenant_id).then(
			({ data, error }) => {
				if (error) return;

				setVariants(data || []);
			},
		);
	}, [currentUser?.subscriptionInfo?.tenant_id]);

	const loadInventoryItems = useCallback(async () => {
		fetchInventoryItemOptions(currentUser?.subscriptionInfo?.tenant_id).then(
			({ data, error }) => {
				if (error) return;

				setInventoryItems(data || []);
			},
		);
	}, [currentUser?.subscriptionInfo?.tenant_id]);

	useEffect(() => {
		loadPurchaseOrders();
		loadInventoryItems();
		loadStores();
		loadVariants();
		loadSuppliers();
	}, [
		loadPurchaseOrders,
		loadInventoryItems,
		loadStores,
		loadVariants,
		loadSuppliers,
	]);

	useEffect(() => {
		if (isInitialPageLoad) {
			setIsInitialPageLoad(false);
			// return shorty on initial page load
			return;
		}

		// reset pagination
		router.push(`?page=${currentPage}`);
		loadPurchaseOrders();
	}, [currentPage, loadPurchaseOrders, isInitialPageLoad, router]);

	const handleAdd = () => {
		setEditingPurchaseOrder(null);
		setIsModalOpen(true);
	};

	const handleEdit = (id: string) => {
		const order = purchaseOrders.find((order) => order.id === id);
		setEditingPurchaseOrder(order);
		setIsModalOpen(true);
	};

	const handleArchive = async (id: string) => {
		resetModalState();

		try {
			const { error } = await updatePurchaseOrderRecordStatus(id, {
				status: RecordStatus.ARCHIVED,
			});

			if (error) {
				showServerErrorToast(error.message);
			} else {
				showSuccessToast("Record Archived.");
				const remainingRecords = purchaseOrders.filter(
					(purchaseOrder) => purchaseOrder.id !== id,
				);
				setPurchaseOrders(remainingRecords);
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
			const { error } = await updatePurchaseOrderRecordStatus(id, {
				status: RecordStatus.ACTIVE,
			});

			if (error) {
				showServerErrorToast(error.message);
			} else {
				showSuccessToast(`Record Restored.`);
				const remainingRecords = purchaseOrders.filter(
					(purchaseOrder) => purchaseOrder.id !== id,
				);
				setPurchaseOrders(remainingRecords);
				setTotalRecordsCount(remainingRecords.length);
			}
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async (purchaseOrder: PurchaseOrder) => {
		// Exclude id field while creating new record
		const { id, order_items, ...purchaseOrderWithNoId } = purchaseOrder;

		try {
			const payload = {
				purchase_order_data: purchaseOrderWithNoId,
				purchase_order_items_data: purchaseOrder.order_items,
			};
			const { error } = await savePurchaseOrder(payload);

			if (error) {
				handleServerError(error);
				return;
			}

			setIsModalOpen(false);
			showSuccessToast("Purchase Order Created.");
			loadPurchaseOrders();
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleUpdate = async (purchaseOrder: PurchaseOrder) => {
		// Exclude id field while creating new record
		const { order_items, ...purchaseOrderWithNoOrderItems } = purchaseOrder;

		try {
			const payload = {
				purchase_order_data: purchaseOrderWithNoOrderItems,
				purchase_order_items_data: purchaseOrder.order_items,
				is_for_update: true,
			};
			const { error } = await updatePurchaseOrder(payload);
			if (error) {
				handleServerError(error);
				return;
			}

			setIsModalOpen(false);
			showSuccessToast("Purchase Order Updated.");
			loadPurchaseOrders();
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

	const handleViewDetails = (id: string) => {
		const order = purchaseOrders.find((order) => order.id === id);
		setSelectedOrder(order);
		setShowDetailsModal(true);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case PurchaseOrderStatus.PENDING:
				return "bg-yellow-100 text-yellow-800";
			case PurchaseOrderStatus.RECEIVED:
				return "bg-green-100 text-green-800";
			case PurchaseOrderStatus.CANCELED:
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const handleOrderStatusChange = async (
		id: string,
		status?: PurchaseOrderStatus,
	) => {
		resetModalState();

		if (!status) return;

		try {
			const { error } = await updatePurchaseOrderStatus(id, {
				order_status: status,
			});

			if (error) throw error;

			showSuccessToast(`Order status updated to ${status}`);
			loadPurchaseOrders();
		} catch (_error) {
			showErrorToast();
		}
	};

	const getPurchaseOrderStatusOptions = () => [
		ALL_OPTIONS,
		...PURCHASE_ORDER_STATUSES,
	];

	const getTotalOrderPrice = (order?: PurchaseOrder): number => {
		if (!order || !order.order_items) return 0;

		return order.order_items.reduce((acc, currentOrderItem) => {
			return acc + currentOrderItem.quantity * currentOrderItem.unit_price;
		}, 0);
	};

	const onDateRangeChange = (dates) => {
		const [start, end] = dates;

		setStartDate(start);
		setEndDate(end);
	};

	const onReceivedDateRangeChange = (dates) => {
		const [start, end] = dates;

		setReceivedDateStart(start);
		setReceivedDateEnd(end);
	};

	const resetModalState = () => {
		setCurrentActiveId("");
		setIsArchiveConfirmationModalOpen(false);
		setIsRestoreConfirmationModalOpen(false);
		setIsMoveToPendingConfirmationModalOpen(false);
		setIsMoveToReceivedConfirmationModalOpen(false);
		setIsMoveToCanceledConfirmationModalOpen(false);
	};

	const handleServerError = (error: PostgrestError) => {
		if (error.message.includes(VALIDATION_ERRORS_MAPPING.serverError)) {
			showErrorToast(
				VALIDATION_ERRORS_MAPPING.entities.purchase_order.fields.name
					.displayError,
			);
		} else {
			showServerErrorToast(error.message);
		}
	};

	const getReportFields = (purchaseOrder, idx: number) => {
		return purchaseOrder.order_items?.map((orderItem, innerIdx) => {
			// Show row number for SalesOrders not Items
			const showRowNo = innerIdx === 0;

			return {
				row_no: showRowNo ? idx + 1 : "",
				// Order details
				po_number: showRowNo ? purchaseOrder.po_number : "",
				supplier: showRowNo ? purchaseOrder.supplier?.name : "",
				order_status: showRowNo ? purchaseOrder.order_status : "",
				expected_date: showRowNo ? purchaseOrder.expected_date : "",
				received_date: showRowNo
					? getDateWithoutTime(purchaseOrder.received_date)
					: "",
				created_at: showRowNo
					? getDateWithoutTime(purchaseOrder.created_at)
					: "",
				// Order Item details
				store: orderItem.store.name,
				item_name: orderItem.item.name,
				item_sku: orderItem.item.sku,
				quantity: orderItem.quantity,
				unit_price: orderItem.unit_price,
			};
		});
	};

	return (
		<div className="space-y-6">
			<div className="w-full md:w-5/6">
				<div className="md:flex md:justify-between md:items-center">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							Purchase Order Management
						</h1>
						<p className="text-gray-600">
							Manage your purchase orders from your supplier suppliers
						</p>
					</div>
					<AddButton label={"Add Order"} handleAdd={handleAdd} />
				</div>
			</div>

			{/* Purchase Order Table */}
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
								reportName="Purchase Orders"
								records={[
									reportHeaders,
									...purchaseOrders.flatMap((purchaseOrder, idx) =>
										getReportFields(purchaseOrder, idx),
									),
								]}
							/>
							<span className="px-1"></span>
							<ExportPDF
								reportName="Purchase Orders"
								records={[
									reportHeaders,
									...purchaseOrders.flatMap((purchaseOrder, idx) =>
										getReportFields(purchaseOrder, idx),
									),
								]}
							/>
						</div>
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Purchase Order Number
									</th>
									<th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Supplier
									</th>
									<th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Value
									</th>
									<th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Order Status
									</th>
									<th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Expected Date
									</th>
									<th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Received Date
									</th>
									<th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Record Status
									</th>
									<th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
								</tr>
								{showFilters && (
									<tr className="card">
										<th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
										<th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											<select
												value={selectedSupplierId}
												onChange={(e) => {
													setCurrentPage(FIRST_PAGE_NUMBER);
													setSelectedSupplier(e.target.value);
												}}
												className="input-field"
											>
												{suppliers.map((supplier) => (
													<option key={supplier.id} value={supplier.id}>
														{supplier.id === ALL_OPTIONS
															? "All Suppliers"
															: shortenText(
																	supplier.name,
																	MAX_DROPDOWN_TEXT_LENGTH,
																)}
													</option>
												))}
											</select>
										</th>
										<th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
										<th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											<div className="w-full">
												<select
													value={selectedOrderStatus}
													onChange={(e) => {
														setCurrentPage(FIRST_PAGE_NUMBER);
														setSelectedOrderStatus(e.target.value);
													}}
													className="input-field"
												>
													{getPurchaseOrderStatusOptions().map((status) => (
														<option key={status} value={status}>
															{status === ALL_OPTIONS ? "All Statuses" : status}
														</option>
													))}
												</select>
											</div>
										</th>
										<th
											style={{ maxWidth: 30 }}
											className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											<DatePicker
												selected={startDate}
												onChange={onDateRangeChange}
												startDate={startDate}
												endDate={endDate}
												selectsRange
												monthsShown={2}
												placeholderText="Select date range"
												isClearable={true}
												className="input-field"
											/>
										</th>
										<th
											style={{ maxWidth: 30 }}
											className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											<DatePicker
												selected={receivedDateStart}
												onChange={onReceivedDateRangeChange}
												startDate={receivedDateStart}
												endDate={receivedDateEnd}
												selectsRange
												monthsShown={2}
												placeholderText="Select date range"
												isClearable={true}
												className="input-field"
											/>
										</th>
										<th className="px-1 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
										<th
											className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											style={{ minWidth: 150 }}
										></th>
									</tr>
								)}
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{purchaseOrders.map((order) => (
									<tr key={order.id} className="hover:bg-gray-50">
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{order.po_number}(
													<i className="text-sm text-gray-500">
														{order.order_items?.length} items
													</i>
													)
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{order.supplier?.name}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 text-sm text-gray-900">
											{getTotalOrderPrice(order)}
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.order_status)}`}
											>
												{order.order_status}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-gray-900">
											{getDateWithoutTime(
												formatDateToLocalDate(order.expected_date),
											)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-900">
											{formatDateToLocalDate(order.received_date)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-900">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(order.status)}`}
											>
												{order.status}
											</span>
										</td>
										<td className="px-6 py-4 text-right text-sm font-medium">
											<div className="flex justify-center space-x-2 items-center">
												<ActionsMenu
													actions={[
														{
															id: order.id,
															hideOption: false,
															icon: <EyeIcon className="h-4 w-4" />,
															label: "View Details",
															class:
																"w-full text-primary-600 hover:text-primary-900",
															listener: handleViewDetails,
														},
														{
															id: order.id,
															hideOption:
																![PurchaseOrderStatus.CANCELED].includes(
																	order.order_status,
																) || selectedStatus === RecordStatus.ARCHIVED,
															icon: <BackwardIcon className="h-4 w-4" />,
															label: "Return to Pending",
															class:
																"w-full text-yellow-600 hover:text-yellow-900",
															listener: () => {
																setCurrentActiveId(order.id);
																setIsMoveToPendingConfirmationModalOpen(true);
															},
														},
														{
															id: order.id,
															hideOption:
																![
																	PurchaseOrderStatus.PENDING,
																	PurchaseOrderStatus.CANCELED,
																].includes(order.order_status) ||
																selectedStatus === RecordStatus.ARCHIVED,
															icon: <CheckIcon className="h-4 w-4" />,
															label: "Mark as Received",
															class:
																"w-full text-green-600 hover:text-green-900",
															listener: () => {
																setCurrentActiveId(order.id);
																setIsMoveToReceivedConfirmationModalOpen(true);
															},
														},
														{
															id: order.id,
															hideOption:
																[PurchaseOrderStatus.RECEIVED].includes(
																	order.order_status,
																) || selectedStatus === RecordStatus.ARCHIVED,
															icon: <PencilIcon className="h-4 w-4" />,
															label: "Edit",
															class:
																"w-full text-primary-600 hover:text-primary-900",
															listener: handleEdit,
														},
														{
															id: order.id,
															hideOption:
																![PurchaseOrderStatus.PENDING].includes(
																	order.order_status,
																) || selectedStatus === RecordStatus.ARCHIVED,
															icon: <XMarkIcon className="h-4 w-4" />,
															label: "Cancel Order",
															class:
																"w-full text-yellow-600 hover:text-yellow-900",
															listener: () => {
																setCurrentActiveId(order.id);
																setIsMoveToCanceledConfirmationModalOpen(true);
															},
														},
														{
															id: order.id,
															hideOption:
																[PurchaseOrderStatus.RECEIVED].includes(
																	order.order_status,
																) || selectedStatus !== RecordStatus.ACTIVE,
															icon: <TrashIcon className="h-4 w-4" />,
															label: "Archive",
															class: "w-full text-red-600 hover:text-red-900",
															listener: () => {
																setCurrentActiveId(order.id);
																setIsArchiveConfirmationModalOpen(true);
															},
														},
														{
															id: order.id,
															hideOption:
																selectedStatus === RecordStatus.ACTIVE,
															icon: <ArrowUpOnSquareIcon className="h-4 w-4" />,
															label: "Restore",
															class:
																"w-full text-yellow-600 hover:text-yellow-900",
															listener: () => {
																setCurrentActiveId(order.id);
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

			{/* PurchaseOrder Modal */}
			<PurchaseOrderModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				order={editingPurchaseOrder}
				stores={stores}
				suppliers={suppliers}
				inventoryItems={inventoryItems}
				variants={variants}
				onSave={(order) => {
					setLoading(true);
					if (editingPurchaseOrder) {
						handleUpdate(order);
					} else {
						handleCreate(order);
					}
				}}
			/>

			<OrderDetailsModal
				isOpen={showDetailsModal && selectedOrder !== null}
				onClose={() => setShowDetailsModal(false)}
				order={selectedOrder}
			/>

			{/* Confirmation Modal for Archive */}
			<ConfirmationModal
				isOpen={isArchiveConfirmationModalOpen}
				id={currentActiveId}
				message="Are you sure you want to archive this purchase order?"
				onConfirmationSuccess={handleArchive}
				onConfirmationFailure={resetModalState}
			/>

			{/* Confirmation Modal for Restore */}
			<ConfirmationModal
				isOpen={isRestoreConfirmationModalOpen}
				id={currentActiveId}
				message="Are you sure you want to restore this purchase order?"
				onConfirmationSuccess={handleRestore}
				onConfirmationFailure={resetModalState}
			/>

			{/* Confirmation Modal to move order to pending */}
			<ConfirmationModal
				isOpen={isMoveToPendingConfirmationModalOpen}
				id={currentActiveId}
				orderStatus={PurchaseOrderStatus.PENDING}
				message="Are you sure you want to move this order status to pending?"
				onConfirmationSuccess={handleOrderStatusChange}
				onConfirmationFailure={resetModalState}
			/>

			{/* Confirmation Modal to move order to received */}
			<ConfirmationModal
				isOpen={isMoveToReceivedConfirmationModalOpen}
				id={currentActiveId}
				orderStatus={PurchaseOrderStatus.RECEIVED}
				message="Are you sure you want to move this order status to received? No edits are permitted after submission."
				onConfirmationSuccess={handleOrderStatusChange}
				onConfirmationFailure={resetModalState}
			/>

			{/* Confirmation Modal to move order to canceled */}
			<ConfirmationModal
				isOpen={isMoveToCanceledConfirmationModalOpen}
				id={currentActiveId}
				orderStatus={PurchaseOrderStatus.CANCELED}
				message="Are you sure you want to move this order status to canceled?"
				onConfirmationSuccess={handleOrderStatusChange}
				onConfirmationFailure={resetModalState}
			/>
		</div>
	);
}
