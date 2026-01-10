"use client";

import {
	CubeIcon,
	ExclamationTriangleIcon,
	ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useLoadingContext } from "@/components/context_apis/LoadingProvider";
import { FeedbackSummary } from "@/components/feedback/FeedbackSummary";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { MONTH_NAME_MAPPING, REPORT_DAYS } from "@/lib/Constants";
import { DATABASE_TABLE, RPC_FUNCTION, UserRole } from "@/lib/Enums";
import { showServerErrorToast } from "@/lib/helpers/Helper";
import { makeRpcCall } from "@/lib/server_actions/rpc";
import type {
	DashboardStats,
	PurchaseOrderMonthlyTrendsData,
	SalesOrderMonthlyTrendsData,
} from "@/lib/types/Models";

export default function DashboardPage() {
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
	const [purchaseOrderMonthlyTrendsData, setPurchaseOrderMonthlyTrendsData] =
		useState<PurchaseOrderMonthlyTrendsData[]>([]);
	const [salesOrderMonthlyTrendsData, setSalesOrderMonthlyTrendsData] =
		useState<SalesOrderMonthlyTrendsData[]>([]);
	const [reportDaysCount, setReportDaysCount] = useState(90);
	const { setLoading } = useLoadingContext();
	const { supabase, currentUser } = useAuthContext();

	const loadDashboardStats = useCallback(async () => {
		makeRpcCall(RPC_FUNCTION.DASHBOARD_STATS, {
			report_days_count: reportDaysCount,
		}).then(({ data, error }) => {
			if (error) {
				showServerErrorToast(error.message);
				setLoading(false);
				return;
			}
			setStats(data);
			setLoading(false);
		});
	}, [setLoading, reportDaysCount]);

	const loadOrderMonthlyTrends = useCallback(async () => {
		makeRpcCall(RPC_FUNCTION.PURCHASE_ORDER_MONTHLY_TRENDS, {
			report_days_count: reportDaysCount,
		}).then(({ data: poData, error: poError }) => {
			if (poError) {
				showServerErrorToast(poError.message);
				setLoading(false);
				return;
			}

			const podataProcessed: PurchaseOrderMonthlyTrendsData[] = poData.map(
				(item: PurchaseOrderMonthlyTrendsData) => {
					item.month_name = MONTH_NAME_MAPPING.get(
						item.month_name.split("-")[1],
					);
					return item;
				},
			);
			setPurchaseOrderMonthlyTrendsData(podataProcessed);
			setLoading(false);
		});

		makeRpcCall(RPC_FUNCTION.SALES_ORDER_MONTHLY_TRENDS, {
			report_days_count: reportDaysCount,
		}).then(({ data: soData, error: soError }) => {
			if (soError) {
				showServerErrorToast(soError.message);
				setLoading(false);
				return;
			}

			const soDataProcessed: SalesOrderMonthlyTrendsData[] = soData.map(
				(item: SalesOrderMonthlyTrendsData) => {
					item.month_name = MONTH_NAME_MAPPING.get(
						item.month_name.split("-")[1],
					);
					return item;
				},
			);
			setSalesOrderMonthlyTrendsData(soDataProcessed);
			setLoading(false);
		});
	}, [setLoading, reportDaysCount]);

	const refreshDashboard = useCallback(() => {
		loadDashboardStats();
		loadOrderMonthlyTrends();
	}, [loadDashboardStats, loadOrderMonthlyTrends]);

	useEffect(() => {
		const channel = supabase.channel("dashboard-updates-listener");

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

	const getPercentage = (amount: number, total: number) => {
		if (!amount || !total) {
			return "0%";
		}

		const rate = ((amount / total) * 100).toFixed(2);
		return `${rate}%`;
	};

	const inventoryInsightData = () => {
		return [
			{
				id: 1,
				name: "Expected sales",
				value: stats.pendingSalesOrders,
				color: "#10B981",
			},
			{
				id: 2,
				name: "Incomming Items",
				value: stats.pendingPurchaseOrders,
				color: "#3B82F6",
			},
			{
				id: 3,
				name: "Available Items",
				value: stats.totalItems,
				color: "#F59E0B",
			},
		];
	};

	const totalPurchaseOrders =
		stats.pendingPurchaseOrders +
		stats.receivedPurchaseOrders +
		stats.canceledPurchaseOrders;
	const totalSalesOrders =
		stats.pendingSalesOrders +
		stats.fulfilledSalesOrders +
		stats.canceledSalesOrders;

	const StatCard = ({ title, values, icon: Icon, color }) => (
		<div className="card">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-medium text-gray-600">{title}</p>
					{values.map((value) => (
						<p key={value.label} className="text-xs text-gray-900">
							<span className=" font-bold">
								{value.label}: {value.amount}
							</span>
							{value.percentage && <span>({value.percentage})</span>}
						</p>
					))}
					{/* {trend && (
						<div className="flex items-center mt-1">
							{trend > 0 ? (
								<ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
							) : (
								<ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
							)}
							<span
								className={`text-sm ${trend > 0 ? "text-green-600" : "text-red-600"}`}
							>
								{Math.abs(trend)}% from last month
							</span>
						</div>
					)} */}
				</div>
				<div className={`p-3 rounded-lg ${color}`}>
					<Icon className="h-6 w-6 text-white" />
				</div>
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			<div className="w-full flex">
				<div className="w-3/4">
					<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
					<p className="text-gray-600">
						Overview of your inventory management system
					</p>
				</div>
				<div className="w-1/4">
					<select
						value={reportDaysCount}
						onChange={(e) => setReportDaysCount(Number(e.target.value))}
						className="input-field mt-3"
						required
					>
						{REPORT_DAYS.map((reportDays) => (
							<option key={reportDays} value={reportDays}>
								Last {reportDays} days
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<StatCard
					title="⭐Purchase Orders"
					values={[
						{ label: "Total Orders", amount: totalPurchaseOrders },
						{
							label: "Pending",
							amount: stats.pendingPurchaseOrders,
							percentage: getPercentage(
								stats.pendingPurchaseOrders,
								totalPurchaseOrders,
							),
						},
						{
							label: "Received",
							amount: stats.receivedPurchaseOrders,
							percentage: getPercentage(
								stats.receivedPurchaseOrders,
								totalPurchaseOrders,
							),
						},
						{
							label: "Canceled",
							amount: stats.canceledPurchaseOrders,
							percentage: getPercentage(
								stats.canceledPurchaseOrders,
								totalPurchaseOrders,
							),
						},
					]}
					icon={ShoppingCartIcon}
					color="bg-purple-500"
				/>
				<StatCard
					title="⭐Sales Orders"
					values={[
						{ label: "Total Orders", amount: totalSalesOrders },
						{
							label: "Pending",
							amount: stats.pendingSalesOrders,
							percentage: getPercentage(
								stats.pendingSalesOrders,
								totalSalesOrders,
							),
						},
						{
							label: "Fulfilled",
							amount: stats.fulfilledSalesOrders,
							percentage: getPercentage(
								stats.fulfilledSalesOrders,
								totalSalesOrders,
							),
						},
						{
							label: "Canceled",
							amount: stats.canceledSalesOrders,
							percentage: getPercentage(
								stats.canceledSalesOrders,
								totalSalesOrders,
							),
						},
					]}
					icon={ShoppingCartIcon}
					color="bg-purple-500"
				/>
				<StatCard
					title="🔹Inventory Health"
					values={[
						{ label: "Total Items", amount: stats.totalItems },
						{
							label: "Low Stock Items",
							amount: stats.lowStockItems,
							percentage: getPercentage(stats.lowStockItems, stats.totalItems),
						},
						{
							label: "Out of Stock Items",
							amount: stats.outStockItems,
							percentage: getPercentage(stats.outStockItems, stats.totalItems),
						},
						/*{
							label: "Inventory Value",
							amount: stats.lowStockItems,
							percentage: getPercentage(stats.lowStockItems, stats.totalItems),
						},*/
					]}
					icon={CubeIcon}
					color="bg-green-500"
				/>
				<StatCard
					title="⭐Action Required"
					values={[
						{
							label: "Overdue Purchase Orders",
							amount: stats.overDuePurchaseOrders,
						},
						{ label: "Overdue Sales Orders", amount: stats.overDueSalesOrders },
					]}
					icon={ExclamationTriangleIcon}
					color="bg-red-500"
				/>
				{/* <StatCard
					title="📈Trend Context"
					values={[
						{
							label: "Trend Context",
							amount: stats.lowStockItems,
							percentage: getPercentage(stats.lowStockItems, stats.totalItems),
						},
						{
							label: "▲ +12% from last week",
							amount: stats.lowStockItems,
							percentage: getPercentage(stats.lowStockItems, stats.totalItems),
						},
					]}
					icon={TruckIcon}
					color="bg-purple-500"
				/>
				<StatCard
					title="📈Inventory Metrics"
					values={[
						{
							label: "Inventory Turnover Rate",
							amount: stats.lowStockItems,
							percentage: getPercentage(stats.lowStockItems, stats.totalItems),
						},
						{
							label: "Average Days in Inventory",
							amount: stats.lowStockItems,
							percentage: getPercentage(stats.lowStockItems, stats.totalItems),
						},
						{
							label: "Dead Stock",
							amount: stats.lowStockItems,
							percentage: getPercentage(stats.lowStockItems, stats.totalItems),
						},
					]}
					icon={CubeIcon}
					color="bg-green-500"
				/>
				<StatCard
					title="💰 Financial Metrics"
					values={[
						{
							label: "Total Inventory Value",
							amount: stats.lowStockItems,
							percentage: getPercentage(stats.lowStockItems, stats.totalItems),
						},
						{
							label: "Cost of Goods Sold",
							amount: stats.lowStockItems,
							percentage: getPercentage(stats.lowStockItems, stats.totalItems),
						},
						{
							label: "Revenue??",
							amount: stats.lowStockItems,
							percentage: getPercentage(stats.lowStockItems, stats.totalItems),
						},
					]}
					icon={CubeIcon}
					color="bg-green-500"
				/>
				<StatCard
					title="🧍 Supplier Metrics"
					values={[{ label: "Active Suppliers", amount: stats.totalSuppliers }]}
					icon={TruckIcon}
					color="bg-purple-500"
				/> */}
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Monthly Trends */}
				<div className="card">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						Purchase Order Monthly Trends <small>(Last 6 months)</small>
					</h3>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={purchaseOrderMonthlyTrendsData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="month_name" />
							<YAxis />
							<Tooltip />
							<Bar
								dataKey="ordered_quantity"
								fill="#3B82F6"
								name="Ordered Quantity"
							/>
							<Bar
								dataKey="canceled_quantity"
								fill="#F59E0B"
								name="Canceled Quantity"
							/>
							<Bar
								dataKey="received_quantity"
								fill="#10B981"
								name="Received Quantity"
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
				<div className="card">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						Sales Order Monthly Trends <small>(Last 6 months)</small>
					</h3>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={salesOrderMonthlyTrendsData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="month_name" />
							<YAxis />
							<Tooltip />
							<Bar
								dataKey="ordered_quantity"
								fill="#3B82F6"
								name="Ordered Quantity"
							/>
							<Bar
								dataKey="canceled_quantity"
								fill="#F59E0B"
								name="Canceled Quantity"
							/>
							<Bar
								dataKey="fulfilled_quantity"
								fill="#10B981"
								name="Fulfilled Quantity"
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="card">
				<div className="card">
					<h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
						Inventory Summary
					</h3>
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={inventoryInsightData()}
								cx="50%"
								cy="50%"
								labelLine={false}
								label={({ name, percent }) =>
									`${name} ${(percent * 100).toFixed(2)}%`
								}
								outerRadius={80}
								fill="#8884d8"
								dataKey="value"
							>
								{inventoryInsightData().map((entry) => (
									<Cell key={`cell-${entry.id}`} fill={entry.color} />
								))}
							</Pie>
							<Tooltip />
						</PieChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Recent Activity and Feedback */}
			<div className="grid grid-cols-1 gap-6">
				<div>
					{currentUser?.subscriptionInfo?.role === UserRole.SUPER_ADMIN ? (
						<FeedbackSummary />
					) : (
						<FeedbackWidget />
					)}
				</div>
			</div>
		</div>
	);
}
