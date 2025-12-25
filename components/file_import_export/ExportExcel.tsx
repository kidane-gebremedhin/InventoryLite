"use client";

import { saveAs } from "file-saver";
import type { RowInput } from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getCurrentDateTime } from "@/lib/helpers/Helper";

export default function ExportExcel({
	records,
	reportName,
}: {
	records: RowInput[];
	reportName: string;
}) {
	const exportToExcel = () => {
		const worksheet = XLSX.utils.json_to_sheet(records, { skipHeader: true });
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, reportName);
		const excelBuffer = XLSX.write(workbook, {
			bookType: "xlsx",
			type: "array",
		});
		const data = new Blob([excelBuffer], { type: "application/octet-stream" });
		saveAs(data, `${reportName}-ExportedData-${getCurrentDateTime()}.xlsx`);
	};

	return (
		<button
			type="button"
			onClick={exportToExcel}
			className="btn-outline-success px-4 py-1 text-sm h-7 rounded items-center"
		>
			Export to Excel
		</button>
	);
}
