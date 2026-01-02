"use client";

import { PlusIcon } from "lucide-react";

export function AddButton({
	label,
	handleAdd,
}: {
	label: string;
	handleAdd: () => void;
}) {
	return (
		<button
			type="button"
			onClick={handleAdd}
			className="w-full md:w-1/5 btn-outline-primary flex justify-center items-center"
		>
			<PlusIcon className="h-4 w-4 mr-2" />
			{label}
		</button>
	);
}

export function SaveButton({
	loading,
	label,
}: {
	loading: boolean;
	label?: string;
}) {
	return (
		<button
			type="submit"
			className={loading ? "btn-outline-default" : "btn-outline-primary"}
			disabled={loading}
			style={{ cursor: loading ? "not-allowed" : "pointer" }}
		>
			{loading ? "Saving..." : (label ?? "Save")}
		</button>
	);
}

export function CancelButton({
	loading,
	onClose,
}: {
	loading: boolean;
	onClose: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClose}
			className="btn-outline-default"
			disabled={loading}
			style={{ cursor: loading ? "not-allowed" : "pointer" }}
		>
			Cancel
		</button>
	);
}
