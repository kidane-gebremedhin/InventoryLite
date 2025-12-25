"use client";

import {
	ArrowUpOnSquareIcon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import type { PostgrestError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLoadingContext } from "@/components/context_apis/LoadingProvider";
import ExportExcel from "@/components/file_import_export/ExportExcel";
import ExportPDF from "@/components/file_import_export/ExportPDF";
import ActionsMenu from "@/components/helpers/ActionsMenu";
import { ConfirmationModal } from "@/components/helpers/ConfirmationModal";
import Pagination from "@/components/helpers/Pagination";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { SubscriptionPlanModal } from "@/components/subscription_plan/SubscriptionPlanModal";
import {
	ALL_OPTIONS,
	CURRENCY_TYPES,
	FIRST_PAGE_NUMBER,
	MAX_DROPDOWN_TEXT_LENGTH,
	RECORD_STATUSES,
	RECORDS_PER_PAGE,
	SUBSCRIPTION_STATUSES,
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
import {
	fetchSubscriptionPlans,
	saveSubscriptionPlan,
	updateSubscriptionPlan,
	updateSubscriptionPlanRecordStatus,
} from "@/lib/server_actions/subscription_plan";
import type { SubscriptionPlan } from "@/lib/types/Models";

export default function SubscriptionPlanPage() {
	const router = useRouter();
	const [subscriptionPlans, setSubscriptionPlans] = useState<
		SubscriptionPlan[]
	>([]);
	const [selectedSubscriptionStatus, setSelectedSubscriptionStatus] =
		useState("");
	const [selectedCurrencyType, setSelectedCurrencyType] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSubscriptionPlan, setEditingSubscriptionPlan] =
		useState<SubscriptionPlan | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState(
		RecordStatus.ACTIVE.toString(),
	);
	// Pagination
	const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE);
	const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER);
	const [totalRecordsCount, setTotalRecordsCount] = useState(0);
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
		subscription_status: "Subscription Status",
		currency_type: "Currency",
		payment_amount: "Payment Amount",
		created_at: "Date Created",
	};

	const loadSubscriptionPlans = useCallback(async () => {
		const { startIndex, endIndex } = calculateStartAndEndIndex({
			currentPage,
			recordsPerPage,
		});

		try {
			setLoading(true);

			const { data, count, error } = await fetchSubscriptionPlans({
				tenantId: currentUser?.subscriptionInfo?.tenant_id,
				selectedSubscriptionStatus,
				selectedCurrencyType,
				selectedStatus,
				startIndex,
				endIndex,
			});

			if (error) {
				showServerErrorToast(error.message);
			}
			setSubscriptionPlans(data || []);
			setTotalRecordsCount(count || 0);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	}, [
		currentPage,
		recordsPerPage,
		currentUser?.subscriptionInfo?.tenant_id,
		selectedSubscriptionStatus,
		selectedCurrencyType,
		selectedStatus,
		setLoading,
	]);

	useEffect(() => {
		// reset pagination
		router.push(`?page=${currentPage}`);
		loadSubscriptionPlans();
	}, [currentPage, router, loadSubscriptionPlans]);

	const handleAdd = () => {
		setEditingSubscriptionPlan(null);
		setIsModalOpen(true);
	};

	const handleEdit = (id: string) => {
		const subscriptionPlan = subscriptionPlans.find(
			(subscriptionPlan) => subscriptionPlan.id === id,
		);
		setEditingSubscriptionPlan(subscriptionPlan);
		setIsModalOpen(true);
	};

	const handleArchive = async (id: string) => {
		resetModalState();

		try {
			const { error } = await updateSubscriptionPlanRecordStatus(id, {
				status: RecordStatus.ARCHIVED,
			});

			if (error) {
				showServerErrorToast(error.message);
			} else {
				showSuccessToast("Record Archived.");
				const remainingRecords = subscriptionPlans.filter(
					(subscriptionPlan) => subscriptionPlan.id !== id,
				);
				setSubscriptionPlans(remainingRecords);
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
			const { error } = await updateSubscriptionPlanRecordStatus(id, {
				status: RecordStatus.ACTIVE,
			});

			if (error) {
				showServerErrorToast(error.message);
			} else {
				showSuccessToast("Record Restored.");
				const remainingRecords = subscriptionPlans.filter(
					(subscriptionPlan) => subscriptionPlan.id !== id,
				);
				setSubscriptionPlans(remainingRecords);
				setTotalRecordsCount(remainingRecords.length);
			}
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async (subscriptionPlan: SubscriptionPlan) => {
		// Exclude id field while creating new record
		const { id, ...subscriptionPlanWithNoId } = subscriptionPlan;
		try {
			const { data, error } = await saveSubscriptionPlan(
				subscriptionPlanWithNoId,
			);

			if (error) {
				handleServerError(error);
				return;
			}

			setIsModalOpen(false);
			showSuccessToast("Record Created.");
			setSubscriptionPlans((prev) => [...data, ...prev]);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleUpdate = async (subscriptionPlan: SubscriptionPlan) => {
		try {
			const { data, error } = await updateSubscriptionPlan(
				subscriptionPlan.id,
				subscriptionPlan,
			);

			if (error) {
				handleServerError(error);
				return;
			}

			setIsModalOpen(false);
			showSuccessToast("Record Updated.");
			setSubscriptionPlans((prev) =>
				prev.map((elem) => (elem.id === subscriptionPlan.id ? data[0] : elem)),
			);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const resetModalState = () => {
		setCurrentActiveId("");
		setIsArchiveConfirmationModalOpen(false);
		setIsRestoreConfirmationModalOpen(false);
	};

	const handleServerError = (error: PostgrestError) => {
		if (error.message.includes(VALIDATION_ERRORS_MAPPING.serverError)) {
			showErrorToast(
				VALIDATION_ERRORS_MAPPING.entities.subscriptionPlan.fields
					.subscription_status.displayError,
			);
		} else {
			showServerErrorToast(error.message);
		}
	};

	return (
		<div className="space-y-6">
			<div className="w-full md:w-5/6">
				<div className="md:flex md:justify-between md:items-center">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							Subscription Plan Management
						</h1>
						<p className="text-gray-600">
							Manage subscription Subscription plans
						</p>
					</div>
					<button
						type="button"
						onClick={handleAdd}
						className="w-full md:w-1/4 btn-outline-primary flex justify-center items-center"
					>
						<PlusIcon className="h-5 w-5 mr-2" />
						Add Subscription Plan
					</button>
				</div>
			</div>

			{/* SubscriptionPlan Table */}
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
								reportName="subscription_plans"
								records={[reportHeaders, ...subscriptionPlans].map(
									(subscriptionPlan, idx) => {
										return {
											row_no: idx > 0 ? idx : "Row No.",
											subscription_status: subscriptionPlan.subscription_status,
											currency_type: subscriptionPlan.currency_type,
											payment_amount: subscriptionPlan.payment_amount,
											created_at: getDateWithoutTime(
												subscriptionPlan.created_at,
											),
										};
									},
								)}
							/>
							<span className="px-1"></span>
							<ExportPDF
								reportName="subscription_plans"
								records={[reportHeaders, ...subscriptionPlans].map(
									(subscriptionPlan, idx) => {
										return {
											row_no: idx > 0 ? idx : "Row No.",
											subscription_status: subscriptionPlan.subscription_status,
											currency_type: subscriptionPlan.currency_type,
											payment_amount: subscriptionPlan.payment_amount,
											created_at: getDateWithoutTime(
												subscriptionPlan.created_at,
											),
										};
									},
								)}
							/>
						</div>
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Subscription Type
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Currency
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Payment Amount
									</th>
									<th
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										style={{ minWidth: 150 }}
									>
										Record Status
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
								</tr>
								{showFilters && (
									<tr>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											<select
												value={selectedSubscriptionStatus}
												onChange={(e) => {
													setCurrentPage(FIRST_PAGE_NUMBER);
													setSelectedSubscriptionStatus(e.target.value);
												}}
												className="input-field"
											>
												<option value="">All Subscription Types</option>
												{SUBSCRIPTION_STATUSES.map((status) => (
													<option key={status} value={status}>
														{shortenText(status, MAX_DROPDOWN_TEXT_LENGTH)}
													</option>
												))}
											</select>
										</th>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
											<select
												value={selectedCurrencyType}
												onChange={(e) => {
													setCurrentPage(FIRST_PAGE_NUMBER);
													setSelectedCurrencyType(e.target.value);
												}}
												className="input-field"
											>
												<option value="">All Currencies</option>
												{CURRENCY_TYPES.map((currency) => (
													<option key={currency} value={currency}>
														{shortenText(currency, MAX_DROPDOWN_TEXT_LENGTH)}
													</option>
												))}
											</select>
										</th>
										<th
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											style={{ minWidth: 150 }}
										>
											<div className="w-full">
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
															{status === ALL_OPTIONS ? "All Statuses" : status}
														</option>
													))}
												</select>
											</div>
										</th>
										<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
									</tr>
								)}
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{subscriptionPlans.map((subscriptionPlan) => (
									<tr key={subscriptionPlan.id} className="hover:bg-gray-50">
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{subscriptionPlan.subscription_status}
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{subscriptionPlan.currency_type}
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{subscriptionPlan.payment_amount}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 text-center">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(subscriptionPlan.status)}`}
											>
												{subscriptionPlan.status}
											</span>
										</td>
										<td className="px-6 py-4 text-right text-sm font-medium">
											<div className="flex justify-center space-x-2 items-center">
												<ActionsMenu
													actions={[
														{
															id: subscriptionPlan.id,
															hideOption:
																selectedStatus === RecordStatus.ARCHIVED,
															icon: <PencilIcon className="h-4 w-4" />,
															label: "Edit",
															class:
																"w-full text-primary-600 hover:text-primary-900",
															listener: handleEdit,
														},
														{
															id: subscriptionPlan.id,
															hideOption:
																selectedStatus !== RecordStatus.ACTIVE,
															icon: <TrashIcon className="h-4 w-4" />,
															label: "Archive",
															class: "w-full text-red-600 hover:text-red-900",
															listener: () => {
																setCurrentActiveId(subscriptionPlan.id);
																setIsArchiveConfirmationModalOpen(true);
															},
														},
														{
															id: subscriptionPlan.id,
															hideOption:
																selectedStatus === RecordStatus.ACTIVE,
															icon: <ArrowUpOnSquareIcon className="h-4 w-4" />,
															label: "Restore",
															class:
																"w-full text-yellow-600 hover:text-yellow-900",
															listener: () => {
																setCurrentActiveId(subscriptionPlan.id);
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

			{/* SubscriptionPlan Modal */}
			<SubscriptionPlanModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				subscriptionPlan={editingSubscriptionPlan}
				onSave={(subscriptionPlan) => {
					setLoading(true);
					if (editingSubscriptionPlan) {
						handleUpdate(subscriptionPlan);
					} else {
						handleCreate(subscriptionPlan);
					}
				}}
			/>

			{/* Confirmation Modal for Archive */}
			<ConfirmationModal
				isOpen={isArchiveConfirmationModalOpen}
				id={currentActiveId}
				message="Are you sure you want to archive this subscriptionPlan?"
				onConfirmationSuccess={handleArchive}
				onConfirmationFailure={resetModalState}
			/>

			{/* Confirmation Modal for Restore */}
			<ConfirmationModal
				isOpen={isRestoreConfirmationModalOpen}
				id={currentActiveId}
				message="Are you sure you want to restore this subscriptionPlan?"
				onConfirmationSuccess={handleRestore}
				onConfirmationFailure={resetModalState}
			/>
		</div>
	);
}
