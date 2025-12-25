// components/ActionsMenu.js
"use client"; // This is a client component

import { useEffect, useRef, useState } from "react";

// Define the props for this component
interface Action {
	id: string;
	hideOption: boolean;
	label: string;
	icon;
	class: string;
	listener: (id: string, status?: string) => void;
}

interface ActionsMenuProps {
	actions: Action[];
}

const ActionsMenu = ({ actions }: ActionsMenuProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Close the menu when clicking outside of it
	useEffect(() => {
		const handleOutsideClick = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleOutsideClick);
		return () => {
			document.removeEventListener("mousedown", handleOutsideClick);
		};
	}, []);

	// A simple icon for the dropdown toggle
	const menuIcon = (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<title id="svg-title">d</title>
			<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
		</svg>
	);

	return (
		<div className="md:absolute inline-block text-left" ref={menuRef}>
			<div>
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="md:flex md:items-center md:justify-center md:p-2 rounded-full hover:bg-gray-100 focus:outline-none"
				>
					{menuIcon}
				</button>
			</div>

			{isOpen && (
				<div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
					<div
						className="py-1"
						role="menu"
						aria-orientation="vertical"
						aria-labelledby="options-menu"
					>
						{/* Added a check to ensure `actions` is a valid array before mapping over it */}
						{Array.isArray(actions) &&
							actions.map(
								(action, idx) =>
									!action.hideOption && (
										<div className="pt-2" key={idx}>
											<button
												type="button"
												role="menuitem"
												onClick={() => action.listener(action.id)}
												className={action.class}
											>
												<div className="w-full pl-6 flex justify items-center">
													<span>{action.icon}</span>
													&nbsp;
													<span>{action.label}</span>
												</div>
											</button>
											<hr />
										</div>
									),
							)}
					</div>
				</div>
			)}
		</div>
	);
};

export default ActionsMenu;
