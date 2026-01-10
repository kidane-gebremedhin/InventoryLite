"use client";

import {
	ArrowUpOnSquareIcon,
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
import Pagination from "@/components/helpers/Pagination";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { VariantModal } from "@/components/variant/VariantModal";
import {
	ALL_OPTIONS,
	FIRST_PAGE_NUMBER,
	MAX_TABLE_TEXT_LENGTH,
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
import {
	fetchVariants,
	saveVariant,
	updateVariant,
	updateVariantRecordStatus,
} from "@/lib/server_actions/variant";
import type { Variant } from "@/lib/types/Models";

export default function VariantPage() {
	const router = useRouter();
	const [searchTermTemp, setSearchTermTemp] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [variants, setVariants] = useState<Variant[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
	const [canSeeMore, setCanSeeMore] = useState(true);
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
		name: "Variant Name",
		description: "Description",
		created_at: "Date Created",
	};

	const loadVariants = useCallback(async () => {
		const { startIndex, endIndex } = calculateStartAndEndIndex({
			currentPage,
			recordsPerPage,
		});

		try {
			setLoading(true);

			const { data, count, error } = await fetchVariants({
				tenantId: currentUser?.subscriptionInfo?.tenant_id,
				selectedStatus,
				searchTerm,
				startIndex,
				endIndex,
			});

			if (error) {
				showServerErrorToast(error.message);
			}
			setVariants(data || []);
			setTotalRecordsCount(count || 0);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	}, [
		searchTerm,
		selectedStatus,
		recordsPerPage,
		currentPage,
		currentUser?.subscriptionInfo?.tenant_id,
		setLoading,
	]);

	useEffect(() => {
		// reset pagination
		router.push(`?page=${currentPage}`);
		loadVariants();
	}, [currentPage, router, loadVariants]);

	const handleAdd = () => {
		setEditingVariant(null);
		setIsModalOpen(true);
	};

	const handleEdit = (id: string) => {
		const variant = variants.find((variant) => variant.id === id);
		setEditingVariant(variant);
		setIsModalOpen(true);
	};

	const handleArchive = async (id: string) => {
		resetModalState();

		try {
			const { error } = await updateVariantRecordStatus(id, {
				status: RecordStatus.ARCHIVED,
			});

			if (error) {
				showServerErrorToast(error.message);
			} else {
				showSuccessToast("Record Archived.");
				const remainingRecords = variants.filter(
					(variant) => variant.id !== id,
				);
				setVariants(remainingRecords);
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
			const { error } = await updateVariantRecordStatus(id, {
				status: RecordStatus.ACTIVE,
			});

			if (error) {
				showServerErrorToast(error.message);
			} else {
				showSuccessToast("Record Restored.");
				const remainingRecords = variants.filter(
					(variant) => variant.id !== id,
				);
				setVariants(remainingRecords);
				setTotalRecordsCount(remainingRecords.length);
			}
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async (variant: Variant) => {
		// Exclude id field while creating new record
		const { id, ...variantWithNoId } = variant;
		try {
			const { data, error } = await saveVariant(variantWithNoId);

			if (error) {
				handleServerError(error);
				return;
			}

			setIsModalOpen(false);
			showSuccessToast("Record Created.");
			setVariants((prev) => [...data, ...prev]);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleUpdate = async (variant: Variant) => {
		try {
			const { data, error } = await updateVariant(variant.id, variant);

			if (error) {
				handleServerError(error);
				return;
			}

			setIsModalOpen(false);
			showSuccessToast("Record Updated.");
			setVariants((prev) =>
				prev.map((elem) => (elem.id === variant.id ? data[0] : elem)),
			);
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
			showErrorToast(
				VALIDATION_ERRORS_MAPPING.entities.variant.fields.name.displayError,
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
							Variant Management
						</h1>
						<p className="text-gray-600">Manage your variants of items</p>
					</div>
					<AddButton label={"Add Variant"} handleAdd={handleAdd} />
				</div>
			</div>

			{/* Variant Table */}
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
								reportName="Variants"
								records={[reportHeaders, ...variants].map((variant, idx) => {
									return {
										row_no: idx > 0 ? idx : "Row No.",
										name: variant.name,
										description: variant.description,
										created_at: getDateWithoutTime(variant.created_at),
									};
								})}
							/>
							<span className="px-1"></span>
							<ExportPDF
								reportName="Variants"
								records={[reportHeaders, ...variants].map((variant, idx) => {
									return {
										row_no: idx > 0 ? idx : "Row No.",
										name: variant.name,
										description: variant.description,
										created_at: getDateWithoutTime(variant.created_at),
									};
								})}
							/>
						</div>
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Variant
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Description
									</th>
									<th
										className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
										style={{ minWidth: 150 }}
									>
										Record Status
									</th>
									<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
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
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
									</tr>
								)}
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{variants.map((variant) => (
									<tr key={variant.id} className="hover:bg-gray-50">
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{variant.name}
												</div>
											</div>
										</td>
										<td
											style={{ maxWidth: 200 }}
											className="px-6 py-4 text-sm text-gray-900 o"
										>
											{canSeeMore
												? shortenText(
														variant.description,
														MAX_TABLE_TEXT_LENGTH,
													)
												: variant.description}
											{variant.description?.length > MAX_TABLE_TEXT_LENGTH && (
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
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(variant.status)}`}
											>
												{variant.status}
											</span>
										</td>
										<td className="px-6 py-4 text-right text-sm font-medium">
											<div className="flex justify-center space-x-2 items-center">
												<ActionsMenu
													actions={[
														{
															id: variant.id,
															hideOption:
																selectedStatus === RecordStatus.ARCHIVED,
															icon: <PencilIcon className="h-4 w-4" />,
															label: "Edit",
															class:
																"w-full text-primary-600 hover:text-primary-900",
															listener: handleEdit,
														},
														{
															id: variant.id,
															hideOption:
																selectedStatus !== RecordStatus.ACTIVE,
															icon: <TrashIcon className="h-4 w-4" />,
															label: "Archive",
															class: "w-full text-red-600 hover:text-red-900",
															listener: () => {
																setCurrentActiveId(variant.id);
																setIsArchiveConfirmationModalOpen(true);
															},
														},
														{
															id: variant.id,
															hideOption:
																selectedStatus === RecordStatus.ACTIVE,
															icon: <ArrowUpOnSquareIcon className="h-4 w-4" />,
															label: "Restore",
															class:
																"w-full text-yellow-600 hover:text-yellow-900",
															listener: () => {
																setCurrentActiveId(variant.id);
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

			{/* Variant Modal */}
			<VariantModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				variant={editingVariant}
				onSave={(variant) => {
					setLoading(true);
					if (editingVariant) {
						handleUpdate(variant);
					} else {
						handleCreate(variant);
					}
				}}
			/>

			{/* Confirmation Modal for Archive */}
			<ConfirmationModal
				isOpen={isArchiveConfirmationModalOpen}
				id={currentActiveId}
				message="Are you sure you want to archive this variant?"
				onConfirmationSuccess={handleArchive}
				onConfirmationFailure={resetModalState}
			/>

			{/* Confirmation Modal for Restore */}
			<ConfirmationModal
				isOpen={isRestoreConfirmationModalOpen}
				id={currentActiveId}
				message="Are you sure you want to restore this variant?"
				onConfirmationSuccess={handleRestore}
				onConfirmationFailure={resetModalState}
			/>
		</div>
	);
}
