export default function LowStock({ label }: { label: string }) {
	return (
		<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full  bg-yellow-100 text-red-600">
			{label}
		</span>
	);
}
