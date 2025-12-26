interface Props {
	className?: string;
}
export default function MiniLoading({ className }: Props) {
	return (
		<div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
			<div className="animate-pulse">
				<div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
				<div className="space-y-2">
					<div className="h-3 bg-gray-200 rounded"></div>
					<div className="h-3 bg-gray-200 rounded w-3/4"></div>
					<div className="h-3 bg-gray-200 rounded w-1/2"></div>
				</div>
			</div>
		</div>
	);
}
