"use client";

import {
	ArrowUpOnSquareIcon,
	MagnifyingGlassIcon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import type { PostgrestError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AffiliatePartnerModal } from "@/components/affiliate_partner/AffiliatePartnerModal";
import { useLoadingContext } from "@/components/context_apis/LoadingProvider";
import ExportExcel from "@/components/file_import_export/ExportExcel";
import ExportPDF from "@/components/file_import_export/ExportPDF";
import ActionsMenu from "@/components/helpers/ActionsMenu";
import { ConfirmationModal } from "@/components/helpers/ConfirmationModal";
import Pagination from "@/components/helpers/Pagination";
import {
	ALL_OPTIONS,
	COMMISSION_TYPES,
	FIRST_PAGE_NUMBER,
	MAX_DROPDOWN_TEXT_LENGTH,
	MAX_TABLE_TEXT_LENGTH,
	RECORD_STATUSES,
	RECORDS_PER_PAGE,
	TEXT_SEARCH_TRIGGER_KEY,
	VALIDATION_ERRORS_MAPPING,
} from "@/lib/Constants";
import { CommissionType, RecordStatus } from "@/lib/Enums";
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
	fetchAffiliatePartners,
	saveAffiliatePartner,
	updateAffiliatePartner,
	updateAffiliatePartnerRecordStatus,
} from "@/lib/server_actions/affiliate_partner";
import type { AffiliatePartner } from "@/lib/types/Models";

export default function AffiliatePartnerPage() {
	const router = useRouter();
	const [affiliatePartners, setAffiliatePartners] = useState<
		AffiliatePartner[]
	>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [searchTermTemp, setSearchTermTemp] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingAffiliatePartner, setEditingAffiliatePartner] =
		useState<AffiliatePartner | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	const [canSeeMore, setCanSeeMore] = useState(true);
	const [selectedStatus, setSelectedStatus] = useState(
		RecordStatus.ACTIVE.toString(),
	);
	const [commissionType, setCommissionType] = useState(
		CommissionType.PERCENTAGE.toString(),
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

	const reportHeaders = {
		name: "Partner Name",
		commission_type: "Commission Type",
		commission_value: "Commission Value",
		description: "Description",
		created_at: "Date Created",
	};

	const loadAffiliatePartners = useCallback(async () => {
		const { startIndex, endIndex } = calculateStartAndEndIndex({
			currentPage,
			recordsPerPage,
		});

		try {
			setLoading(true);

			const { data, count, error } = await fetchAffiliatePartners({
				searchTerm,
				commissionType,
				selectedStatus,
				startIndex,
				endIndex,
			});

			if (error) {
				showServerErrorToast(error.message);
			}
			setAffiliatePartners(data || []);
			setTotalRecordsCount(count || 0);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	}, [
		currentPage,
		recordsPerPage,
		searchTerm,
		selectedStatus,
		commissionType,
		setLoading,
	]);

	useEffect(() => {
		// reset pagination
		router.push(`?page=${currentPage}`);
		loadAffiliatePartners();
	}, [currentPage, router, loadAffiliatePartners]);

	const handleAdd = () => {
		setEditingAffiliatePartner(null);
		setIsModalOpen(true);
	};

	const handleEdit = (id: string) => {
		const affiliatePartner = affiliatePartners.find(
			(affiliatePartner) => affiliatePartner.id === id,
		);
		setEditingAffiliatePartner(affiliatePartner);
		setIsModalOpen(true);
	};

	const handleArchive = async (id: string) => {
		resetModalState();

		try {
			const { error } = await updateAffiliatePartnerRecordStatus(id, {
				status: RecordStatus.ARCHIVED,
			});

			if (error) {
				showServerErrorToast(error.message);
			} else {
				showSuccessToast("Record Archived.");
				const remainingRecords = affiliatePartners.filter(
					(affiliatePartner) => affiliatePartner.id !== id,
				);
				setAffiliatePartners(remainingRecords);
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
			const { error } = await updateAffiliatePartnerRecordStatus(id, {
				status: RecordStatus.ACTIVE,
			});

			if (error) {
				showServerErrorToast(error.message);
			} else {
				showSuccessToast("Record Restored.");
				const remainingRecords = affiliatePartners.filter(
					(affiliatePartner) => affiliatePartner.id !== id,
				);
				setAffiliatePartners(remainingRecords);
				setTotalRecordsCount(remainingRecords.length);
			}
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async (affiliatePartner: AffiliatePartner) => {
		// Exclude id field while creating new record
		const { id, ...affiliatePartnerWithNoId } = affiliatePartner;
		try {
			const { data, error } = await saveAffiliatePartner(
				affiliatePartnerWithNoId,
			);

			if (error) {
				handleServerError(error);
				return;
			}

			setIsModalOpen(false);
			showSuccessToast("Record Created.");
			setAffiliatePartners((prev) => [...data, ...prev]);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleUpdate = async (affiliatePartner: AffiliatePartner) => {
		try {
			const { data, error } = await updateAffiliatePartner(
				affiliatePartner.id,
				affiliatePartner,
			);

			if (error) {
				handleServerError(error);
				return;
			}

			setIsModalOpen(false);
			showSuccessToast("Record Updated.");
			setAffiliatePartners((prev) =>
				prev.map((elem) => (elem.id === affiliatePartner.id ? data[0] : elem)),
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
				VALIDATION_ERRORS_MAPPING.entities.affiliatePartner.fields.name
					.displayError,
			);
		} else {
			showServerErrorToast(error.message);
		}
	};

	const handleTextSearch = () => {
		setCurrentPage(FIRST_PAGE_NUMBER);
		setSearchTerm(searchTermTemp.trim());
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

			{/* AffiliatePartner Table */}
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
								reportName="affiliate_partners"
								records={[reportHeaders, ...affiliatePartners].map(
									(affiliatePartner, idx) => {
										return {
											row_no: idx > 0 ? idx : "Row No.",
											name: affiliatePartner.name,
											commission_type: affiliatePartner.commission_type,
											commission_value: affiliatePartner.commission_value,
											description: affiliatePartner.description,
											created_at: getDateWithoutTime(
												affiliatePartner.created_at,
											),
										};
									},
								)}
							/>
							<span className="px-1"></span>
							<ExportPDF
								reportName="affiliate_partners"
								records={[reportHeaders, ...affiliatePartners].map(
									(affiliatePartner, idx) => {
										return {
											row_no: idx > 0 ? idx : "Row No.",
											name: affiliatePartner.name,
											commission_type: affiliatePartner.commission_type,
											commission_value: affiliatePartner.commission_value,
											description: affiliatePartner.description,
											created_at: getDateWithoutTime(
												affiliatePartner.created_at,
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
										Partner Name
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Commission Type
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Commission Value
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Description
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
										<th
											colSpan={2}
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											<div className="relative">
												<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
												<input
													type="text"
													placeholder="Search by name or description... and press ENTER key"
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
												value={commissionType}
												onChange={(e) => {
													setCurrentPage(FIRST_PAGE_NUMBER);
													setCommissionType(e.target.value);
												}}
												className="input-field"
											>
												<option value="">All Commission Types</option>
												{COMMISSION_TYPES.map((status) => (
													<option key={status} value={status}>
														{shortenText(status, MAX_DROPDOWN_TEXT_LENGTH)}
													</option>
												))}
											</select>
										</th>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
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
								{affiliatePartners.map((affiliatePartner) => (
									<tr key={affiliatePartner.id} className="hover:bg-gray-50">
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{affiliatePartner.name}
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{affiliatePartner.commission_type}
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{affiliatePartner.commission_value}
												</div>
											</div>
										</td>
										<td
											style={{ maxWidth: 200 }}
											className="px-6 py-4 text-sm text-gray-900 o"
										>
											{canSeeMore
												? shortenText(
													affiliatePartner.description,
													MAX_TABLE_TEXT_LENGTH,
												)
												: affiliatePartner.description}
											{affiliatePartner.description &&
												affiliatePartner.description.length >
												MAX_TABLE_TEXT_LENGTH && (
													<button
														type="button"
														onClick={() => setCanSeeMore(!canSeeMore)}
														className="text-blue-300"
													>
														{canSeeMore ? "more" : "  less..."}
													</button>
												)}
										</td>
										<td className="px-6 py-4 text-center">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(affiliatePartner.status)}`}
											>
												{affiliatePartner.status}
											</span>
										</td>
										<td className="px-6 py-4 text-right text-sm font-medium">
											<div className="flex justify-center space-x-2 items-center">
												<ActionsMenu
													actions={[
														{
															id: affiliatePartner.id,
															hideOption:
																selectedStatus === RecordStatus.ARCHIVED,
															icon: <PencilIcon className="h-4 w-4" />,
															label: "Edit",
															class:
																"w-full text-primary-600 hover:text-primary-900",
															listener: handleEdit,
														},
														{
															id: affiliatePartner.id,
															hideOption:
																selectedStatus !== RecordStatus.ACTIVE,
															icon: <TrashIcon className="h-4 w-4" />,
															label: "Archive",
															class: "w-full text-red-600 hover:text-red-900",
															listener: () => {
																setCurrentActiveId(affiliatePartner.id);
																setIsArchiveConfirmationModalOpen(true);
															},
														},
														{
															id: affiliatePartner.id,
															hideOption:
																selectedStatus === RecordStatus.ACTIVE,
															icon: <ArrowUpOnSquareIcon className="h-4 w-4" />,
															label: "Restore",
															class:
																"w-full text-yellow-600 hover:text-yellow-900",
															listener: () => {
																setCurrentActiveId(affiliatePartner.id);
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

			{/* AffiliatePartner Modal */}
			<AffiliatePartnerModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				affiliatePartner={editingAffiliatePartner}
				onSave={(affiliatePartner) => {
					setLoading(true);
					if (editingAffiliatePartner) {
						handleUpdate(affiliatePartner);
					} else {
						handleCreate(affiliatePartner);
					}
				}}
			/>

			{/* Confirmation Modal for Archive */}
			<ConfirmationModal
				isOpen={isArchiveConfirmationModalOpen}
				id={currentActiveId}
				message="Are you sure you want to archive this affiliatePartner?"
				onConfirmationSuccess={handleArchive}
				onConfirmationFailure={resetModalState}
			/>

			{/* Confirmation Modal for Restore */}
			<ConfirmationModal
				isOpen={isRestoreConfirmationModalOpen}
				id={currentActiveId}
				message="Are you sure you want to restore this affiliatePartner?"
				onConfirmationSuccess={handleRestore}
				onConfirmationFailure={resetModalState}
			/>
		</div>
	);
}
