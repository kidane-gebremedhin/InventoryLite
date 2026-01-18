"use client";

import {
	ArrowRightOnRectangleIcon,
	Cog6ToothIcon,
	UserCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FeedbackNotification } from "@/components/feedback/FeedbackNotification";
import { ROUTE_PATH } from "@/lib/Enums";
import {
	capitalizeFirstLetter,
	formatDateToYYMMDD,
} from "@/lib/helpers/Helper";
import { LowStockLevelNotification } from "../notifications/LowStockLevelNotification";
import { useAuthContext } from "../providers/AuthProvider";

export default function Header() {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	// Global States
	const { currentUser, signOut } = useAuthContext();

	// Create a ref for the container element
	const dropdownRef = useRef(null);

	useEffect(() => {
		// Logic to detect if click was outside the ref
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
		}

		// Bind the event listener
		if (isDropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		// Clean up the listener
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isDropdownOpen]);

	const handleSignOut = async () => {
		setLoading(true);
		await signOut();
	};

	if (loading || !currentUser) {
		return (
			<header
				className="md:w-full bg-white shadow-sm border-b border-gray-200"
				style={{ position: "fixed", zIndex: 2 }}
			>
				<div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"></div>
			</header>
		);
	}

	return (
		<header
			className="md:w-5/6 bg-white shadow-sm border-b border-gray-200"
			style={{ position: "fixed", zIndex: 2 }}
		>
			<div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
				<div className="flex items-center">
					<h2 className="text-lg font-semibold text-gray-900 pl-9 md:pl-0">
						Welcome back,{" "}
						{capitalizeFirstLetter(
							currentUser?.subscriptionInfo?.name ||
								currentUser?.fullName?.split(" ")[0],
						)}
						.
					</h2>
				</div>

				<div className="flex items-center md:space-x-4">
					<button
						type="button"
						className="text-gray-400 hover:text-gray-600 mx-2 mt-2"
					>
						<FeedbackNotification />
					</button>
					<button
						type="button"
						className="text-gray-400 hover:text-gray-600 mx-2 mt-2"
					>
						<LowStockLevelNotification />
					</button>

					<div className="relative" ref={dropdownRef}>
						<button
							type="button"
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
						>
							{currentUser.picturePicture ? (
								<Image
									src={currentUser.picturePicture}
									alt="Profile"
									className="h-8 w-8 rounded-full"
									width={48}
									height={48}
									unoptimized
								/>
							) : (
								<UserCircleIcon className="h-8 w-8" />
							)}
						</button>

						{isDropdownOpen && (
							<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
								<div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100 text-center">
									<div className="font-medium">
										<strong>
											{currentUser?.subscriptionInfo?.name ||
												currentUser?.fullName?.split("@")[0]}
										</strong>
									</div>
									<div
										className="text-orange-500 py-1"
										style={{ textTransform: "capitalize" }}
									>
										{currentUser?.subscriptionInfo?.subscription_status?.replaceAll(
											"_",
											" ",
										)}
									</div>
									<div className="text-gray-500">
										Active until:{" "}
										<u>
											<strong>
												<i>
													{formatDateToYYMMDD(
														currentUser?.subscriptionInfo
															?.current_payment_expiry_date,
													)}
												</i>
											</strong>
										</u>
									</div>
								</div>
								<div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
									<Link href={ROUTE_PATH.SETTING} className="flex">
										<Cog6ToothIcon className="h-4 w-4 mr-2 flex" />{" "}
										<span className="flex">Settings</span>
									</Link>
								</div>
								<button
									type="button"
									onClick={handleSignOut}
									className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
								>
									<ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
									Sign out
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
