import styles from "@/app/styles/Tooltip.module.css";

// Define the types for your component's props
interface TooltipProps {
	text: string;
	children: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
	return (
		<div className={styles.tooltipContainer} data-tooltip={text}>
			{children}
		</div>
	);
}
