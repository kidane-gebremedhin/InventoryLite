"use client";

import { RotateCw } from "lucide-react";
import Tooltip from "./ToolTip";

export default function HardReload() {
	const handleHardReload = () => {
		// This triggers a full browser refresh
		window.location.reload();
	};

	return (
		<button
			type="button"
			className="flex fixed bottom-5 right-5 px-4 py-2 text-blue-500 rounded z-99 p-6 bg-gray-200 rounded-6xl shadow-lg shadow-blue-500/50"
			onClick={handleHardReload}
		>
			<Tooltip text="Reload">
				<RotateCw className="w-5 h-5 text-blue-600" />
			</Tooltip>
		</button>
	);
}
