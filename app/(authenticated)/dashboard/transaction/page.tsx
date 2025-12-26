"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
// DatePicker both are required
import DatePicker from "react-datepicker";
import Pagination from "@/components/helpers/Pagination";
import {
	ALL_OPTIONS,
	FIRST_PAGE_NUMBER,
	MAX_DROPDOWN_TEXT_LENGTH,
	RECORDS_PER_PAGE,
	TRANSACTION_DIRECTIONS,
} from "@/lib/Constants";
import { RecordStatus, TransactionDirection } from "@/lib/Enums";
import {
	calculateStartAndEndIndex,
	canShowLoadingScreen,
	formatDateToLocalDate,
	getDateWithoutTime,
	getTransactionDirectionColor,
	shortenText,
	showErrorToast,
	showServerErrorToast,
} from "@/lib/helpers/Helper";
import type { InventoryItem, Store, Transaction } from "@/lib/types/Models";
import "react-datepicker/dist/react-datepicker.css";

import { useLoadingContext } from "@/components/context_apis/LoadingProvider";

import ExportExcel from "@/components/file_import_export/ExportExcel";
import ExportPDF from "@/components/file_import_export/ExportPDF";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { fetchInventoryItemOptions } from "@/lib/server_actions/inventory_item";
import { fetchStoreOptions } from "@/lib/server_actions/store";
import { fetchTransactions } from "@/lib/server_actions/transaction";

export default function SalesOrderPage() {
	const router = useRouter();
	const [selectedStatus] = useState(RecordStatus.ACTIVE.toString());
	// Pagination
	const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE);
	const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER);
	const [totalRecordsCount, setTotalRecordsCount] = useState(0);
	const [stores, setStores] = useState<Store[]>([]);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [inventoryItems, setInventoryItems] = useState<
		Partial<InventoryItem>[]
	>([]);
	const [selectedInventoryItemId, setSelectedInventoryItemId] =
		useState<string>(ALL_OPTIONS);
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [selectedStoreId, setSelectedStoreId] = useState<string>(ALL_OPTIONS);
	const [selectedDirection, setSelectedDirection] =
		useState<string>(ALL_OPTIONS);
	const [showFilters, setShowFilters] = useState(false);
	// Global States
	const { setLoading } = useLoadingContext();
	const { currentUser } = useAuthContext();

	const reportHeaders = {
		direction: "Direction",
		store_id: "From Store",
		item: "Item",
		quantity: "Quantity",
		current_item_quantity: "Remaining Quantity",
		created_at: "Transaction Date",
	};

	const loadInventoryItems = useCallback(async () => {
		try {
			fetchInventoryItemOptions(currentUser?.subscriptionInfo?.tenant_id).then(
				({ data, error }) => {
					if (error) throw error;

					const selectableInventoryItems: Partial<InventoryItem>[] = [
						{ id: ALL_OPTIONS, name: "" },
						...data,
					];
					setInventoryItems(selectableInventoryItems);
				},
			);
		} catch (_error) {
			showErrorToast();
		}
	}, [currentUser?.subscriptionInfo?.tenant_id]);

	const loadStores = useCallback(async () => {
		try {
			fetchStoreOptions(currentUser?.subscriptionInfo?.tenant_id).then(
				({ data, error }) => {
					if (error) throw error;

					const selectableStores: Store[] = [
						{ id: ALL_OPTIONS, name: "", description: "" },
						...(data || []),
					];
					setStores(selectableStores);
				},
			);
		} catch (_error) {
			showErrorToast();
		}
	}, [currentUser?.subscriptionInfo?.tenant_id]);

	const loadTransactions = useCallback(async () => {
		setLoading(canShowLoadingScreen(startDate, endDate, null, null));

		const { startIndex, endIndex } = calculateStartAndEndIndex({
			currentPage,
			recordsPerPage,
		});

		try {
			fetchTransactions({
				tenantId: currentUser?.subscriptionInfo?.tenant_id,
				selectedStatus,
				selectedDirection,
				selectedStoreId,
				selectedInventoryItemId,
				startDate,
				endDate,
				startIndex,
				endIndex,
			}).then(({ data, count, error }) => {
				if (error) {
					showServerErrorToast(error.message);
				}

				setTransactions(data || []);
				setTotalRecordsCount(count || 0);
			});
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	}, [
		currentUser?.subscriptionInfo?.tenant_id,
		selectedStatus,
		selectedDirection,
		selectedStoreId,
		selectedInventoryItemId,
		startDate,
		endDate,
		recordsPerPage,
		currentPage,
		setLoading,
	]);

	useEffect(() => {
		loadStores();
		loadInventoryItems();
	}, [loadStores, loadInventoryItems]);

	useEffect(() => {
		// reset pagination
		router.push(`?page=${currentPage}`);
		loadTransactions();
	}, [currentPage, router, loadTransactions]);

	const onDateRangeChange = (dates) => {
		const [start, end] = dates;

		setStartDate(start);
		setEndDate(end);
	};

	const getReportFields = (transaction, idx: number) => {
		return {
			row_no: idx > 0 ? idx : "Row No.",
			direction: transaction.direction,
			store_id: transaction.store?.name,
			item: transaction.item?.name,
			quantity: transaction.quantity,
			current_item_quantity: transaction.current_item_quantity,
			created_at:
				idx > 0
					? getDateWithoutTime(transaction.created_at)
					: transaction.created_at,
		};
	};

	return (
		<div className="space-y-6">
			{/* SalesOrder Table */}
			<div className="card">
				<div className="w-full overflow-x-scroll p-4">
					<div className="w-[1000px]">
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
								reportName="Transactions"
								records={[reportHeaders, ...transactions].map(
									(transaction, idx) => getReportFields(transaction, idx),
								)}
							/>
							<span className="px-1"></span>
							<ExportPDF
								reportName="Transactions"
								records={[reportHeaders, ...transactions].map(
									(transaction, idx) => getReportFields(transaction, idx),
								)}
							/>
						</div>
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
										Direction
									</th>
									<th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
										Item
									</th>
									<th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
										Txn Quantity
									</th>
									<th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
										From/To Store
									</th>
									<th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
										Date Create/Updated
									</th>
									<th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
										Available Quantity
									</th>
								</tr>
								{showFilters && (
									<tr className="card">
										<th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											<select
												value={selectedDirection}
												onChange={(e) => {
													setCurrentPage(FIRST_PAGE_NUMBER);
													setSelectedDirection(e.target.value);
												}}
												className="input-field"
											>
												{TRANSACTION_DIRECTIONS.map((direction) => (
													<option key={direction} value={direction}>
														{direction === ALL_OPTIONS ? "All" : direction}
													</option>
												))}
											</select>
										</th>
										<th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											<select
												value={selectedInventoryItemId}
												onChange={(e) => {
													setCurrentPage(FIRST_PAGE_NUMBER);
													setSelectedInventoryItemId(e.target.value);
												}}
												className="input-field"
											>
												{inventoryItems.map((item) => (
													<option key={item.id} value={item.id}>
														{item.id === ALL_OPTIONS
															? "All Items"
															: shortenText(
																	item.name,
																	MAX_DROPDOWN_TEXT_LENGTH,
																)}
													</option>
												))}
											</select>
										</th>
										<th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
										<th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											<select
												value={selectedStoreId}
												onChange={(e) => {
													setCurrentPage(FIRST_PAGE_NUMBER);
													setSelectedStoreId(e.target.value);
												}}
												className="input-field"
											>
												{stores.map((store) => (
													<option key={store.id} value={store.id}>
														{store.id === ALL_OPTIONS
															? "All Stores"
															: shortenText(
																	store.name,
																	MAX_DROPDOWN_TEXT_LENGTH,
																)}
													</option>
												))}
											</select>
										</th>
										<th
											style={{ maxWidth: 30 }}
											className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
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
										<th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
									</tr>
								)}
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{transactions.map((transaction) => (
									<tr key={transaction.id} className="hover:bg-gray-50">
										<td className="px-1 py-4 text-sm text-gray-900 text-center">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionDirectionColor(transaction.direction)}`}
											>
												{transaction.direction}
											</span>
										</td>
										<td className="text-sm font-medium text-gray-900 text-center px-1 py-4">
											{transaction.item?.name}
										</td>
										<td className="px-1 py-4 text-sm text-gray-900 text-center">
											{transaction.direction === TransactionDirection.IN
												? "+"
												: "-"}
											{transaction.quantity}
										</td>
										<td className="px-1 py-4 text-sm text-gray-900 text-center">
											{transaction.store?.name}
										</td>
										<td className="px-1 py-4 text-sm text-gray-900 text-center">
											{formatDateToLocalDate(transaction.created_at)}
										</td>
										<td className="px-1 py-4 text-sm text-gray-900 text-center">
											<b>{transaction.current_item_quantity}</b>
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
		</div>
	);
}
