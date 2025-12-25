import { REPORTS_PER_PAGE_OPTIONS } from "@/lib/Constants";
import NoRecordsFound from "./NoRecordsFound";

interface RecordsPerPageProps {
	actualRecords: number;
	recordsPerPage: number;
	setRecordsPerPage: (perPage: number) => void;
}

export default function Pagination({
	actualRecords,
	recordsPerPage,
	setRecordsPerPage,
}: RecordsPerPageProps) {
	if (!actualRecords) return <NoRecordsFound />;

	return (
		<div className="card w-full items-left pt-12">
			<span className="px-2">Records per page:</span>
			<select
				value={recordsPerPage}
				onChange={(e) => {
					setRecordsPerPage(parseInt(e.target.value, 10));
				}}
				className="text-blue-500"
			>
				{REPORTS_PER_PAGE_OPTIONS.map((perPage) => (
					<option key={perPage} value={perPage}>
						{perPage}
					</option>
				))}
			</select>
		</div>
	);
}
