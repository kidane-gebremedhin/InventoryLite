"use client";

import { BellIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DATABASE_TABLE, ROUTE_PATH, RPC_FUNCTION } from "@/lib/Enums";
import { makeRpcCall } from "@/lib/server_actions/rpc";
import type { DashboardStats } from "@/lib/types/Models";
import Tooltip from "../helpers/ToolTip";
import { useAuthContext } from "../providers/AuthProvider";

interface LowStockLevelNotificationProps {
	className?: string;
}

export function LowStockLevelNotification({
	className = "",
}: LowStockLevelNotificationProps) {
	const [stats, setStats] = useState<DashboardStats>({
		totalItems: 0,
		lowStockItems: 0,
		outStockItems: 0,
		totalSuppliers: 0,
		pendingPurchaseOrders: 0,
		receivedPurchaseOrders: 0,
		canceledPurchaseOrders: 0,
		overDuePurchaseOrders: 0,
		pendingSalesOrders: 0,
		fulfilledSalesOrders: 0,
		canceledSalesOrders: 0,
		overDueSalesOrders: 0,
		totalValue: 0,
		monthlyGrowth: 0,
	});
	const { supabase } = useAuthContext();

	const loadDashboardStats = useCallback(async () => {
		makeRpcCall(RPC_FUNCTION.DASHBOARD_STATS, {
			report_days_count: 10 * 365,
		}).then(({ data, error }) => {
			if (error) {
				console.log("Error fetching dashboard stats", error.message);
				return;
			}
			setStats(data);
		});
	}, []);

	const refreshDashboard = useCallback(() => {
		loadDashboardStats();
	}, [loadDashboardStats]);

	useEffect(() => {
		const channel = supabase.channel("notification-updates-listener");

		channel.on(
			"postgres_changes",
			{ event: "*", schema: "public", table: DATABASE_TABLE.inventory_items },
			() => refreshDashboard(),
		);
		channel.on(
			"postgres_changes",
			{ event: "*", schema: "public", table: DATABASE_TABLE.purchase_orders },
			() => refreshDashboard(),
		);
		channel.on(
			"postgres_changes",
			{ event: "*", schema: "public", table: DATABASE_TABLE.sales_orders },
			() => refreshDashboard(),
		);

		channel.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [supabase, refreshDashboard]);

	useEffect(() => {
		refreshDashboard();
	}, [refreshDashboard]);

	const lowStockCount = stats.outStockItems + stats.lowStockItems;

	return (
		<div className="mt-0">
			<Tooltip text="Low/Out stock items">
				<Link
					href={ROUTE_PATH.INVENTORY_ITEM}
					className={`relative p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 ${className}`}
				>
					<BellIcon className="h-6 w-6" />
					{lowStockCount > 0 && (
						<span className="absolute top-4 -right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
							{lowStockCount > 9 ? "9+" : lowStockCount}
						</span>
					)}
				</Link>
			</Tooltip>
		</div>
	);
}
