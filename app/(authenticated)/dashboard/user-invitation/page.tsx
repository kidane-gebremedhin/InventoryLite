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
import UserInvitationModal from "@/components/user_invitation/UserInvitationModal";
import {
	ALL_OPTIONS,
	FIRST_PAGE_NUMBER,
	INVITATION_STATUSES,
	RECORDS_PER_PAGE,
	TEXT_SEARCH_TRIGGER_KEY,
	VALIDATION_ERRORS_MAPPING,
} from "@/lib/Constants";
import { InvitationStatus } from "@/lib/Enums";
import {
	calculateStartAndEndIndex,
	formatDateToLocalDate,
	getDateWithoutTime,
	getInvitationStatusColor,
	showErrorToast,
	showServerErrorToast,
	showSuccessToast,
} from "@/lib/helpers/Helper";
import {
	fetchUserInvitations,
	saveUserInvitation,
	updateUserInvitation,
	updateUserInvitationStatus,
} from "@/lib/server_actions/user_invitation";
import type { UserInvitation } from "@/lib/types/Models";

export default function UserInvitationPage() {
	const router = useRouter();
	const [searchTermTemp, setSearchTermTemp] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [userInvitations, setUserInvitations] = useState<UserInvitation[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingUserInvitation, setEditingUserInvitation] =
		useState<UserInvitation | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState(
		InvitationStatus.OPEN.toString(),
	);
	// Pagination
	const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE);
	const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER);
	const [totalRecordsCount, setTotalRecordsCount] = useState(0);
	// Record Actions
	const [currentActiveId, setCurrentActiveId] = useState<string>("");
	const [isExpireConfirmationModalOpen, setIsExpireConfirmationModalOpen] =
		useState(false);
	const [isOpenConfirmationModalOpen, setIsOpenConfirmationModalOpen] =
		useState(false);
	// Global States
	const { setLoading } = useLoadingContext();
	const { currentUser } = useAuthContext();

	const reportHeaders = {
		email: "Email",
		status: "Status",
		created_at: "Date Created",
		expires_at: "Expiration Date",
	};

	const loadUserInvitations = useCallback(async () => {
		const { startIndex, endIndex } = calculateStartAndEndIndex({
			currentPage,
			recordsPerPage,
		});

		try {
			setLoading(true);

			const { data, count, error } = await fetchUserInvitations({
				tenantId: currentUser?.subscriptionInfo?.tenant_id,
				selectedStatus,
				searchTerm,
				startIndex,
				endIndex,
			});

			if (error) {
				showServerErrorToast(error.message);
			}
			setUserInvitations(data || []);
			setTotalRecordsCount(count || 0);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	}, [
		currentUser?.subscriptionInfo?.tenant_id,
		selectedStatus,
		searchTerm,
		currentPage,
		recordsPerPage,
		setLoading,
	]);

	useEffect(() => {
		// reset pagination
		router.push(`?page=${currentPage}`);
		loadUserInvitations();
	}, [loadUserInvitations, router, currentPage]);

	const handleAdd = () => {
		setEditingUserInvitation(null);
		setIsModalOpen(true);
	};

	const handleEdit = (id: string) => {
		const userInvitation = userInvitations.find(
			(userInvitation) => userInvitation.id === id,
		);
		setEditingUserInvitation(userInvitation);
		setIsModalOpen(true);
	};

	const handleExpire = async (id: string) => {
		resetModalState();

		try {
			const { error } = await updateUserInvitationStatus(id, {
				status: InvitationStatus.EXPIRED,
			});

			if (error) {
				showServerErrorToast(error.message);
			} else {
				showSuccessToast("Invitation Expired.");
				const remainingRecords = userInvitations.filter(
					(userInvitation) => userInvitation.id !== id,
				);
				setUserInvitations(remainingRecords);
				setTotalRecordsCount(remainingRecords.length);
			}
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleOpen = async (id: string) => {
		resetModalState();

		try {
			const { error } = await updateUserInvitationStatus(id, {
				status: InvitationStatus.OPEN,
			});

			if (error) {
				showServerErrorToast(error.message);
			} else {
				showSuccessToast("Record Opend.");
				const remainingRecords = userInvitations.filter(
					(userInvitation) => userInvitation.id !== id,
				);
				setUserInvitations(remainingRecords);
				setTotalRecordsCount(remainingRecords.length);
			}
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async (userInvitation: Partial<UserInvitation>) => {
		// Exclude id field while creating new record
		const { id, ...userInvitationWithNoId } = userInvitation;
		try {
			const { data, error } = await saveUserInvitation(
				currentUser?.subscriptionInfo?.tenant_name,
				userInvitationWithNoId,
			);
			if (error) {
				handleServerError(error);
				return;
			}

			setIsModalOpen(false);
			showSuccessToast("Invitation Sent.");
			setUserInvitations((prev) => [...data, ...prev]);
		} catch (_error) {
			showErrorToast();
		} finally {
			setLoading(false);
		}
	};

	const handleUpdate = async (userInvitation: Partial<UserInvitation>) => {
		try {
			const { data, error } = await updateUserInvitation(
				userInvitation.id,
				userInvitation,
			);

			if (error) {
				handleServerError(error);
				return;
			}

			setIsModalOpen(false);
			showSuccessToast("Invitation Updated.");
			setUserInvitations((prev) =>
				prev.map((elem) =>
					elem.id === userInvitation.id ? data[0] : userInvitation,
				),
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
		setIsExpireConfirmationModalOpen(false);
		setIsOpenConfirmationModalOpen(false);
	};

	const handleServerError = (error: PostgrestError) => {
		if (error.message.includes(VALIDATION_ERRORS_MAPPING.serverError)) {
			showErrorToast(
				VALIDATION_ERRORS_MAPPING.entities.userInvitation.fields.email
					.displayError,
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
							User Invitation Management
						</h1>
						<p className="text-gray-600">Manage your user invitations</p>
					</div>
					<AddButton label={"Invitate User"} handleAdd={handleAdd} />
				</div>
			</div>

			{/* UserInvitation Table */}
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
								reportName="UserInvitations"
								records={[reportHeaders, ...userInvitations].map(
									(userInvitation, idx) => {
										return {
											row_no: idx > 0 ? idx : "Row No.",
											email: userInvitation.email,
											status: userInvitation.status,
											created_at: getDateWithoutTime(userInvitation.created_at),
											expires_at: getDateWithoutTime(userInvitation.expires_at),
										};
									},
								)}
							/>
							<span className="px-1"></span>
							<ExportPDF
								reportName="UserInvitations"
								records={[reportHeaders, ...userInvitations].map(
									(userInvitation, idx) => {
										return {
											row_no: idx > 0 ? idx : "Row No.",
											email: userInvitation.email,
											status: userInvitation.status,
											created_at: getDateWithoutTime(userInvitation.created_at),
											expires_at: getDateWithoutTime(userInvitation.expires_at),
										};
									},
								)}
							/>
						</div>
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Email
									</th>
									<th
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										style={{ minWidth: 150 }}
									>
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Invitation Date
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Expiration Date
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
								</tr>
								{showFilters && (
									<tr>
										<th
											colSpan={4}
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											<div className="relative">
												<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
												<input
													type="text"
													placeholder="Search by email... and press ENTER key"
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
													{INVITATION_STATUSES.map((status) => (
														<option key={status} value={status}>
															{status === ALL_OPTIONS ? "All Statuses" : status}
														</option>
													))}
												</select>
											</div>
										</th>
										<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
										<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
										<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
									</tr>
								)}
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{userInvitations.map((userInvitation) => (
									<tr key={userInvitation.id} className="hover:bg-gray-50">
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{userInvitation.email}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 text-center">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInvitationStatusColor(userInvitation.status)}`}
											>
												{userInvitation.status}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-gray-900">
											{getDateWithoutTime(
												formatDateToLocalDate(userInvitation.created_at),
											)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-900">
											{getDateWithoutTime(
												formatDateToLocalDate(userInvitation.expires_at),
											)}
										</td>
										<td className="px-6 py-4 text-right text-sm font-medium">
											<div className="flex justify-center space-x-2 items-center">
												{userInvitation.status !==
													InvitationStatus.ACCEPTTED && (
													<ActionsMenu
														actions={[
															{
																id: userInvitation.id,
																hideOption:
																	selectedStatus !== InvitationStatus.OPEN,
																icon: <PencilIcon className="h-4 w-4" />,
																label: "Edit",
																class:
																	"w-full text-primary-600 hover:text-primary-900",
																listener: handleEdit,
															},
															{
																id: userInvitation.id,
																hideOption:
																	selectedStatus !== InvitationStatus.OPEN,
																icon: <TrashIcon className="h-4 w-4" />,
																label: "Expire",
																class: "w-full text-red-600 hover:text-red-900",
																listener: () => {
																	setCurrentActiveId(userInvitation.id);
																	setIsExpireConfirmationModalOpen(true);
																},
															},
															{
																id: userInvitation.id,
																hideOption:
																	selectedStatus !== InvitationStatus.EXPIRED,
																icon: (
																	<ArrowUpOnSquareIcon className="h-4 w-4" />
																),
																label: "Re-open",
																class:
																	"w-full text-yellow-600 hover:text-yellow-900",
																listener: () => {
																	setCurrentActiveId(userInvitation.id);
																	setIsOpenConfirmationModalOpen(true);
																},
															},
														]}
													/>
												)}
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

			{/* UserInvitation Modal */}
			<UserInvitationModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				userInvitation={editingUserInvitation}
				onSave={(userInvitation) => {
					setLoading(true);
					if (editingUserInvitation) {
						handleUpdate(userInvitation);
					} else {
						handleCreate(userInvitation);
					}
				}}
			/>

			{/* Confirmation Modal for Expire */}
			<ConfirmationModal
				isOpen={isExpireConfirmationModalOpen}
				id={currentActiveId}
				message="Are you sure you want to expire this user invitation?"
				onConfirmationSuccess={handleExpire}
				onConfirmationFailure={resetModalState}
			/>

			{/* Confirmation Modal for Open */}
			<ConfirmationModal
				isOpen={isOpenConfirmationModalOpen}
				id={currentActiveId}
				message="Are you sure you want to open this user invitation?"
				onConfirmationSuccess={handleOpen}
				onConfirmationFailure={resetModalState}
			/>
		</div>
	);
}
