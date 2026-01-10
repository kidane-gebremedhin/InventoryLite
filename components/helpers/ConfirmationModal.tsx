"use client";

import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useLoadingContext } from "../context_apis/LoadingProvider";

interface ConfirmationModalProps {
	isOpen: boolean;
	id: string;
	orderStatus?: string;
	message: string;
	onConfirmationSuccess: (id: string, orderStatus?: string) => void;
	onConfirmationFailure: () => void;
}

export function ConfirmationModal({
	isOpen,
	id,
	orderStatus,
	message,
	onConfirmationSuccess,
	onConfirmationFailure,
}: ConfirmationModalProps) {
	// Global States
	const { setLoading } = useLoadingContext();

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
				<div className="card">{message}</div>
				<div className="flex justify-end space-x-3 pt-4">
					<button
						type="button"
						onClick={() => {
							setLoading(true);
							onConfirmationSuccess(id, orderStatus);
						}}
						className="btn-outline-error"
					>
						<div className="flex items-center">
							<CheckIcon className="h-6 w-6" /> Confirm
						</div>
					</button>
					<button
						type="button"
						onClick={() => onConfirmationFailure()}
						className="btn-outline-default"
					>
						<div className="flex items-center">
							<XMarkIcon className="h-6 w-6" /> Cancel
						</div>
					</button>
				</div>
			</div>
		</div>
	);
}
