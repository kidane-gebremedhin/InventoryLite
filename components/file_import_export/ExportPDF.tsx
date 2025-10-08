"use client";

import { APP_NAME } from '@/lib/app_config/config';
import { getCurrentDateTime, getCurrentDate } from '@/lib/helpers/Helper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExportPDF({ records, reportName }: { records: any[], reportName: string }) {
  const exportToPDF = () => {
    const doc = new jsPDF();
    // Title
    doc.setFontSize(20);
    doc.text(`${reportName} | Exported from ${APP_NAME} on ${getCurrentDate()}`, 14, 15);

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
    <button onClick={exportToPDF} className="bg-orange-600 px-4 py-1 text-sm h-7 text-white rounded items-center">
      Export to PDF
    </button>
  );
}
