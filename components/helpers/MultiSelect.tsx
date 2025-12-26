import { Check, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
	options;
	preSelectedValues;
	changeHandler: (data) => void;
}

/**
 * Custom Multi-Select Input Field Component
 * @returns {JSX.Element}
 */
const MultiSelect = ({ options, preSelectedValues, changeHandler }: Props) => {
	const [selectedOptions, setSelectedOptions] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const inputRef = useRef(null);
	const containerRef = useRef(null);

	useEffect(() => {
		if (preSelectedValues && preSelectedValues.length > 0) {
			setSelectedOptions(preSelectedValues);
		}
	}, [preSelectedValues]);

	// Close the dropdown if the user clicks outside the component
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target)
			) {
				changeHandler(selectedOptions);
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [selectedOptions, changeHandler]);

	// Filter available options based on search term and already selected items
	const availableOptions = useMemo(() => {
		const selectedIds = new Set(selectedOptions.map((opt) => opt.id));

		return options
			.filter((option) => !selectedIds.has(option.id))
			.filter((option) =>
				option.name.toLowerCase().includes(searchTerm.toLowerCase()),
			);
	}, [selectedOptions, options, searchTerm]);

	// Handler for selecting an option from the dropdown
	const handleSelect = (option) => {
		setSelectedOptions([...selectedOptions, option]);
		setSearchTerm("");
		setIsOpen(false);
		inputRef.current?.focus();
	};

	// Handler for removing a selected option tag
	const handleDeselect = (id) => {
		setSelectedOptions(selectedOptions.filter((opt) => opt.id !== id));
		inputRef.current?.focus();
	};

	return (
		<div className="flex items-center justify-center bg-gray-50">
			<div
				ref={containerRef}
				className="w-full max-w-xl bg-white rounded-xl border border-gray-200"
			>
				<div className="relative z-10">
					{/* Main Input/Selected Tags Container */}
					<div
						className={`flex flex-wrap items-center min-h-[44px] border ${
							isOpen
								? "border-indigo-500 ring-2 ring-indigo-200"
								: "border-gray-300"
						} rounded-lg transition-all cursor-text`}
						onClick={() => {
							inputRef.current?.focus();
							setIsOpen(true);
						}}
						onKeyDown={() => {}}
					>
						{/* Selected Tags */}
						{selectedOptions.map((option) => (
							<span
								key={option.id}
								className="flex items-center bg-indigo-100 text-indigo-700 text-sm font-medium mr-2 my-1 px-3 py-1 rounded-full whitespace-nowrap"
							>
								{option.name}
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										handleDeselect(option.id);
									}}
									className="ml-1 text-indigo-500 hover:text-indigo-900 transition-colors focus:outline-none"
									aria-label={`Remove ${option.name}`}
								>
									<X className="w-4 h-4" />
								</button>
							</span>
						))}

						{/* Search Input */}
						<input
							ref={inputRef}
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onFocus={() => setIsOpen(true)}
							onKeyDown={(e) => {
								// Allows removing the last tag if input is empty and Backspace is pressed
								if (
									e.key === "Backspace" &&
									searchTerm === "" &&
									selectedOptions.length > 0
								) {
									e.preventDefault();
									handleDeselect(
										selectedOptions[selectedOptions.length - 1].id,
									);
								}
							}}
							className="flex-grow min-w-[100px] p-1 bg-transparent focus:outline-none placeholder-gray-500 text-gray-800"
							placeholder={
								selectedOptions.length === 0
									? "Select Variants..."
									: "Search or add..."
							}
						/>
					</div>

					{/* Dropdown List */}
					{isOpen && (
						<div className="absolute w-full bg-white border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
							{availableOptions.length > 0 ? (
								availableOptions.map((option) => (
									<div
										key={option.id}
										onClick={() => handleSelect(option)}
										onKeyDown={() => {}}
										className="flex items-center justify-between p-3 cursor-pointer hover:bg-indigo-50 transition-colors text-gray-800"
									>
										<span>{option.name}</span>
										{/* Optional: Show a checkmark if the item is selected (though filtering already handles this) */}
										{selectedOptions.some((o) => o.id === option.id) && (
											<Check className="w-4 h-4 text-indigo-500" />
										)}
									</div>
								))
							) : (
								<div className="p-3 text-gray-500 text-center">
									{searchTerm
										? `No results found for "${searchTerm}"`
										: "All options selected"}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default MultiSelect;
