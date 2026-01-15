"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { InvitationStatus } from "@/lib/Enums";
import { showErrorToast } from "@/lib/helpers/Helper";
import type { UserInvitation } from "@/lib/types/Models";
import { useLoadingContext } from "../context_apis/LoadingProvider";
import { CancelButton, SaveButton } from "../helpers/buttons";

const emptyEntry: Partial<UserInvitation> = {
	email: "",
};

interface UserInvitationModalProps {
	isOpen: boolean;
	onClose: () => void;
	userInvitation: Partial<UserInvitation> | null;
	onSave: (userInvitation: Partial<UserInvitation>) => void;
}

interface FormErrors {
	name?: string;
	email?: string;
	phone?: string;
}

export default function UserInvitationModal({
	isOpen,
	onClose,
	userInvitation,
	onSave,
}: UserInvitationModalProps) {
	const { loading } = useLoadingContext();
	const [formData, setFormData] = useState<Partial<UserInvitation>>(emptyEntry);
	const [errors, setErrors] = useState<FormErrors>({});

	const resetForm = useCallback(() => {
		setFormData({
			email: "",
		});
		setErrors({});
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		if (userInvitation) {
			setFormData({
				email: userInvitation.email,
			});
		} else {
			resetForm();
		}
		setErrors({});
	}, [isOpen, userInvitation, resetForm]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.email) {
			showErrorToast("Please fill in all required fields.");
			return;
		}

		const newUserInvitation: Partial<UserInvitation> = {
			id: userInvitation?.id,
			email: formData.email.trim(),
			status: userInvitation?.status || InvitationStatus.OPEN,
		};

		onSave(newUserInvitation);
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-bold">
						{userInvitation ? "Edit User Invitation" : "Invite a new user"}
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
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							User Email *
						</span>
						<input
							type="email"
							value={formData.email}
							onChange={(e) => handleInputChange("email", e.target.value)}
							className={`input-field ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
							placeholder="Enter user email"
							autoFocus
							required
						/>
						{errors.email && (
							<p className="mt-1 text-sm text-red-600">{errors.email}</p>
						)}
					</div>

					<div className="flex justify-end space-x-3 pt-4">
						<CancelButton loading={loading} onClose={onClose} />
						<SaveButton
							loading={loading}
							label={userInvitation ? "Update User Invitation" : "Invite User"}
						/>
					</div>
				</form>
			</div>
		</div>
	);
}
