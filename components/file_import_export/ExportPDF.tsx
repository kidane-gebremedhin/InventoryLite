"use client";

import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import { APP_NAME } from "@/lib/app_config/config";
import { getCurrentDate, getCurrentDateTime } from "@/lib/helpers/Helper";

export default function ExportPDF({
	records,
	reportName,
}: {
	records: RowInput[];
	reportName: string;
}) {
	const exportToPDF = () => {
		const doc = new jsPDF();
		// Title
		doc.setFontSize(20);
		doc.text(
			`${reportName} | Exported from ${APP_NAME} on ${getCurrentDate()}`,
			14,
			15,
		);

		// Table
		autoTable(doc, {
			startY: 25,
			body: records,
			styles: { fontSize: 10 },
			headStyles: { fillColor: [66, 139, 202] },
		});

		doc.save(`${reportName}-ExportedData-${getCurrentDateTime()}.pdf`);
	};

	return (
		<button
			type="button"
			onClick={exportToPDF}
			className="btn-outline-warning px-4 py-1 text-sm h-7 rounded items-center"
		>
			Export to PDF
		</button>
	);
}
