"use client";

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DATABASE_TABLE, ROUTE_PATH, UserRole } from "@/lib/Enums";
import { fetchUnreadCount } from "@/lib/server_actions/feedback";
import Tooltip from "../helpers/ToolTip";
import { useAuthContext } from "../providers/AuthProvider";

interface FeedbackNotificationProps {
	className?: string;
}

export function FeedbackNotification({
	className = "",
}: FeedbackNotificationProps) {
	const [unreadCount, setUnreadCount] = useState(0);
	const { supabase, currentUser } = useAuthContext();

	const loadUnreadCount = useCallback(async () => {
		try {
			const { data, error } = await fetchUnreadCount();

			if (error) throw error;
			setUnreadCount(data?.length || 0);
		} catch (_error) {}
	}, []);

	useEffect(() => {
		if (currentUser?.subscriptionInfo?.role === UserRole.SUPER_ADMIN) {
			const channel = supabase.channel("feedback-change-listener");

			channel.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: DATABASE_TABLE.feedback },
				() => loadUnreadCount(),
			);

			channel.subscribe();

			return () => {
				supabase.removeChannel(channel);
			};
		}
	}, [currentUser?.subscriptionInfo?.role, supabase, loadUnreadCount]);

	useEffect(() => {
		if (currentUser?.subscriptionInfo?.role === UserRole.SUPER_ADMIN) {
			loadUnreadCount();
		}
	}, [currentUser, loadUnreadCount]);

	if (currentUser?.subscriptionInfo?.role !== UserRole.SUPER_ADMIN) return null;

	return (
		<Link
			href={ROUTE_PATH.ADMIN_FEEDBACK_MANAGEMENT}
			className={`relative p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 ${className}`}
		>
			<div className="mt-0">
				<Tooltip text="Open feedback">
					<ChatBubbleLeftRightIcon className="h-6 w-6" />
				</Tooltip>
			</div>
			{unreadCount > 0 && (
				<span className="absolute top-4 -right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
					{unreadCount > 9 ? "9+" : unreadCount}
				</span>
			)}
		</Link>
	);
}
