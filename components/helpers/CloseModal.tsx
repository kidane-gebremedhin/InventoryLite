interface CloseModalProps {
	onClose: () => void;
}
export default function CloseModal({ onClose }: CloseModalProps) {
	return (
		<div className="flex justify-end mt-6 pt-6 bitem-t">
			<button type="button" onClick={onClose} className="btn-outline-default">
				Close
			</button>
		</div>
	);
}
